import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { persistClientProfileGps } from '@/utils/persistProfileGps';

/** Sync filter-store GPS into client_profiles for live map people pins. */
export function useProfileGpsPersist() {
  const { user } = useAuth();
  const lat = useFilterStore((s) => s.userLatitude);
  const lng = useFilterStore((s) => s.userLongitude);
  const passportMode = useFilterStore((s) => s.passportMode);

  useEffect(() => {
    if (!user?.id || passportMode || lat == null || lng == null) return;
    void persistClientProfileGps(user.id, lat, lng);
  }, [user?.id, lat, lng, passportMode]);
}