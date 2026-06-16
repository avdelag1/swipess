import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/state/filterStore';
import { backfillProfileGpsFromCity, persistClientProfileGps } from '@/utils/persistProfileGps';

/** Sync filter-store GPS into client_profiles + backfill city-only profiles for map pins. */
export function useProfileGpsPersist() {
  const { user } = useAuth();
  const lat = useFilterStore((s) => s.userLatitude);
  const lng = useFilterStore((s) => s.userLongitude);
  const passportMode = useFilterStore((s) => s.passportMode);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);

  useEffect(() => {
    if (!user?.id) return;

    if (!passportMode && lat != null && lng != null) {
      void persistClientProfileGps(user.id, lat, lng);
      return;
    }

    void (async () => {
      const filled = await backfillProfileGpsFromCity(user.id);
      if (!filled || lat != null || lng != null) return;

      const { data } = await supabase
        .from('client_profiles')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.latitude != null && data?.longitude != null) {
        setUserLocation(data.latitude, data.longitude);
      }
    })();
  }, [user?.id, lat, lng, passportMode, setUserLocation]);
}