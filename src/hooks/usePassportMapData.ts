import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { useAuth } from '@/hooks/useAuth';

export interface MapListingPin {
  id: string;
  title: string;
  price?: number;
  category?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  lat: number;
  lng: number;
  imageUrl?: string;
  distanceKm?: number;
}

export interface MapProfilePin {
  id: string;
  name: string;
  city?: string;
  bio?: string;
  age?: number;
  occupation?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  distanceKm?: number;
  /** Active on platform in the last 7 days */
  recentlyActive?: boolean;
}

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function usePassportMapData(
  lat: number | null,
  lng: number | null,
  radiusKm: number,
  enabled = true,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['passport-map-data', lat, lng, radiusKm, user?.id],
    enabled: enabled && lat != null && lng != null,
    staleTime: 30_000,
    refetchInterval: enabled ? 30_000 : false,
    queryFn: async () => {
      const [listingsRes, profilesRes] = await Promise.all([
        supabase.rpc('get_passport_map_listings', {
          p_user_lat: lat!,
          p_user_lon: lng!,
          p_radius_km: radiusKm,
          p_limit: 300,
        }),
        supabase.rpc('get_passport_map_profiles', {
          p_user_lat: lat!,
          p_user_lon: lng!,
          p_radius_km: radiusKm,
          p_limit: 300,
          p_exclude_user_id: user?.id ?? undefined,
        }),
      ]);

      if (listingsRes.error) throw listingsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const listingsRaw = listingsRes.data || [];
      const profilesRaw = profilesRes.data || [];
      const now = Date.now();

      const listings: MapListingPin[] = listingsRaw.map((l) => {
        const imgs = Array.isArray(l.images) ? l.images : [];
        const first = imgs[0];
        return {
          id: l.id,
          title: l.title || 'Listing',
          price: l.price != null ? Number(l.price) : undefined,
          category: l.category ?? undefined,
          city: l.city ?? undefined,
          bedrooms: l.bedrooms ?? undefined,
          bathrooms: l.bathrooms ?? undefined,
          lat: l.latitude,
          lng: l.longitude,
          imageUrl: first ? getCardImageUrl(first) : undefined,
          distanceKm: l.distance_km,
        };
      });

      const profiles: MapProfilePin[] = profilesRaw.map((p) => {
        const imgs = Array.isArray(p.profile_images) ? p.profile_images : [];
        const first = typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url;
        const updatedAt = p.updated_at ? new Date(p.updated_at).getTime() : 0;
        return {
          id: p.user_id,
          name: p.name || 'User',
          city: p.city ?? undefined,
          bio: p.bio ?? undefined,
          age: p.age ?? undefined,
          occupation: p.occupation ?? undefined,
          lat: p.latitude,
          lng: p.longitude,
          imageUrl: first ? getCardImageUrl(first) : undefined,
          distanceKm: p.distance_km,
          recentlyActive: updatedAt > 0 && now - updatedAt < ACTIVE_WINDOW_MS,
        };
      });

      return {
        listings,
        profiles,
        peopleCount: profiles.length,
        activePeopleCount: profiles.filter(p => p.recentlyActive).length,
      };
    },
  });
}