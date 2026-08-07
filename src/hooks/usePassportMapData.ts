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

/** Live presence window — matches SQL filter on location_updated_at. */
const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** ~100m grid — stops GPS jitter from invalidating the query key every watch tick. */
function roundMapCoord(value: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Stable per-id offset so pins at the same address stay separated and never drift on refetch. */
function applyScatter(lat: number, lng: number, id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  // ~60–140m ring — visible separation without leaving the neighborhood
  const radiusDeg = 0.00055 + (Math.abs(hash % 100) / 100) * 0.00075;
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  return {
    lat: lat + Math.sin(angle) * radiusDeg,
    lng: lng + Math.cos(angle) * radiusDeg,
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
          p_limit: 120,
        }),
        supabase.rpc('get_passport_map_profiles', {
          p_user_lat: searchLat!,
          p_user_lon: searchLng!,
          p_radius_km: radiusKm,
          p_limit: 120,
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
        const scattered = applyScatter(l.latitude, l.longitude, l.id);
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

      // Server filters to device GPS + 7d after migration. Client defense:
      // require location_updated_at when present; hide legacy city pins otherwise.
      const profiles: MapProfilePin[] = [];
      for (const p of profilesRaw) {
        const locRaw = (p as { location_updated_at?: string | null }).location_updated_at;
        const locAt = locRaw ? new Date(locRaw).getTime() : 0;
        // Without a device location stamp, treat as stale city/legacy pin — hide
        if (!(locAt > 0 && now - locAt < ACTIVE_WINDOW_MS)) continue;

        const imgs = Array.isArray(p.profile_images) ? p.profile_images : [];
        const first = typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url;
        const scattered = applyScatter(p.latitude, p.longitude, p.user_id);
        profiles.push({
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
          recentlyActive: true,
        });
      }

      return {
        listings,
        profiles,
        peopleCount: profiles.length,
        activePeopleCount: profiles.filter(p => p.recentlyActive).length,
      };
    },
  });
}