import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { persistClientProfileGps } from '@/utils/persistProfileGps';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import { seedGpsCache } from '@/utils/mapGpsCache';

/**
 * Keep client_profiles.latitude/longitude in sync with the user's phone GPS.
 * Runs on login/session + whenever filter-store GPS updates.
 * Does NOT write city-centroid fake pins (those polluted the live map).
 */
export function useProfileGpsPersist() {
  const { user } = useAuth();
  const lat = useFilterStore((s) => s.userLatitude);
  const lng = useFilterStore((s) => s.userLongitude);
  const passportMode = useFilterStore((s) => s.passportMode);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);
  const promptedForUser = useRef<string | null>(null);

  // Persist whenever we already have a non-passport location in the store
  useEffect(() => {
    if (!user?.id) return;
    if (passportMode) return;
    if (lat == null || lng == null) return;
    void persistClientProfileGps(user.id, lat, lng);
  }, [user?.id, lat, lng, passportMode]);

  // On login / first mount for this user: request live phone GPS once
  useEffect(() => {
    if (!user?.id) {
      promptedForUser.current = null;
      return;
    }
    if (promptedForUser.current === user.id) return;
    promptedForUser.current = user.id;

    if (!canGeolocate()) return;

    let cancelled = false;
    void (async () => {
      try {
        const pos = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 60_000,
        });
        if (cancelled) return;
        seedGpsCache(pos.latitude, pos.longitude);
        if (!useFilterStore.getState().passportMode) {
          setUserLocation(pos.latitude, pos.longitude);
        }
        await persistClientProfileGps(user.id, pos.latitude, pos.longitude);
      } catch {
        // Permission denied / timeout — no fake city pin fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, setUserLocation]);
}
