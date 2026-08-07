import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { persistClientProfileGps } from '@/utils/persistProfileGps';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import { seedGpsCache } from '@/utils/mapGpsCache';

/** Min gap between full GPS refreshes (login + app resume). */
const RESUME_GPS_MIN_MS = 2 * 60 * 1000;

/**
 * Keep client_profiles.latitude/longitude in sync with the user's phone GPS.
 * Runs on login/session, app resume / tab focus, and whenever filter-store GPS updates.
 * Markers on the passport map use location_source=device + location_updated_at
 * so only recent real phone positions appear — never stale city centroids.
 */
export function useProfileGpsPersist() {
  const { user } = useAuth();
  const lat = useFilterStore((s) => s.userLatitude);
  const lng = useFilterStore((s) => s.userLongitude);
  const passportMode = useFilterStore((s) => s.passportMode);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);
  const lastFullRefreshAt = useRef(0);
  const activeUserId = useRef<string | null>(null);

  // Persist whenever we already have a non-passport location in the store
  useEffect(() => {
    if (!user?.id) return;
    if (passportMode) return;
    if (lat == null || lng == null) return;
    void persistClientProfileGps(user.id, lat, lng);
  }, [user?.id, lat, lng, passportMode]);

  // Login + resume: pull fresh phone GPS and stamp location_updated_at
  useEffect(() => {
    if (!user?.id) {
      activeUserId.current = null;
      lastFullRefreshAt.current = 0;
      return;
    }
    activeUserId.current = user.id;
    if (!canGeolocate()) return;

    let cancelled = false;

    const refreshPhoneGps = async (force: boolean) => {
      const uid = activeUserId.current;
      if (!uid || cancelled) return;
      const now = Date.now();
      if (!force && now - lastFullRefreshAt.current < RESUME_GPS_MIN_MS) return;

      try {
        const pos = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: force ? 30_000 : 60_000,
        });
        if (cancelled || activeUserId.current !== uid) return;
        lastFullRefreshAt.current = Date.now();
        seedGpsCache(pos.latitude, pos.longitude);
        if (!useFilterStore.getState().passportMode) {
          setUserLocation(pos.latitude, pos.longitude);
        }
        await persistClientProfileGps(uid, pos.latitude, pos.longitude);
      } catch {
        // Permission denied / timeout — no fake city pin fallback
      }
    };

    // First open / login for this session
    void refreshPhoneGps(true);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshPhoneGps(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    // Capacitor native app resume (dynamic import — web-safe)
    let removeAppListener: (() => void) | undefined;
    void (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) void refreshPhoneGps(false);
        });
        if (cancelled) {
          void handle.remove();
        } else {
          removeAppListener = () => { void handle.remove(); };
        }
      } catch {
        // Web / no Capacitor App plugin
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      removeAppListener?.();
    };
  }, [user?.id, setUserLocation]);
}
