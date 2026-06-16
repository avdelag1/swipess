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

/** ~100m grid — stops GPS jitter from invalidating the query key every watch tick. */
function roundMapCoord(value: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Deterministic micro-scatter to prevent perfect overlaps
function applyScatter(lat: number, lng: number, id: string, index: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  // ~15 to 25 meters scatter
  const radius = 0.0001 + (Math.abs(hash % 100) / 100) * 0.00015;
  const angle = (Math.abs(hash) + index) * 2.39996;
  return {
    lat: lat + Math.sin(angle) * radius,
    lng: lng + Math.cos(angle) * radius,
  };
}

export function usePassportMapData(
  lat: number | null,
  lng: number | null,
  radiusKm: number,
  enabled = true,
) {
  const { user } = useAuth();

  const searchLat = lat != null ? roundMapCoord(lat) : null;
  const searchLng = lng != null ? roundMapCoord(lng) : null;

  return useQuery({
    queryKey: ['passport-map-data', searchLat, searchLng, radiusKm, user?.id],
    enabled: enabled && searchLat != null && searchLng != null,
    staleTime: 30_000,
    refetchInterval: enabled ? 30_000 : false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const [listingsRes, profilesRes] = await Promise.all([
        supabase.rpc('get_passport_map_listings', {
          p_user_lat: searchLat!,
          p_user_lon: searchLng!,
          p_radius_km: radiusKm,
          p_limit: 300,
        }),
        supabase.rpc('get_passport_map_profiles', {
          p_user_lat: searchLat!,
          p_user_lon: searchLng!,
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

      const listings: MapListingPin[] = listingsRaw.map((l, index) => {
        const imgs = Array.isArray(l.images) ? l.images : [];
        const first = imgs[0];
        const scattered = applyScatter(l.latitude, l.longitude, l.id, index);
        return {
          id: l.id,
          title: l.title || 'Listing',
          price: l.price != null ? Number(l.price) : undefined,
          category: l.category ?? undefined,
          city: l.city ?? undefined,
          bedrooms: l.bedrooms ?? undefined,
          bathrooms: l.bathrooms ?? undefined,
          lat: scattered.lat,
          lng: scattered.lng,
          imageUrl: first ? getCardImageUrl(first) : undefined,
          distanceKm: l.distance_km,
        };
      });

      const profiles: MapProfilePin[] = profilesRaw.map((p, index) => {
        const imgs = Array.isArray(p.profile_images) ? p.profile_images : [];
        const first = typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url;
        const updatedAt = p.updated_at ? new Date(p.updated_at).getTime() : 0;
        const scattered = applyScatter(p.latitude, p.longitude, p.user_id, index);
        return {
          id: p.user_id,
          name: p.name || 'User',
          city: p.city ?? undefined,
          bio: p.bio ?? undefined,
          age: p.age ?? undefined,
          occupation: p.occupation ?? undefined,
          lat: scattered.lat,
          lng: scattered.lng,
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