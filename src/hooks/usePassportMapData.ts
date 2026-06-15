import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { filterByDistance, haversineKm } from '@/utils/matchingFilters';
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
        supabase
          .from('listings')
          .select('id, title, price, images, category, city, latitude, longitude, bedrooms, bathrooms')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .or('is_active.eq.true,is_active.is.null')
          .limit(300),
        supabase
          .from('client_profiles')
          .select('user_id, name, city, latitude, longitude, profile_images, bio, age, occupation, updated_at')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(300),
      ]);

      const listingsRaw = listingsRes.data || [];
      const profilesRaw = (profilesRes.data || []).filter(
        (p: { user_id: string }) => p.user_id !== user?.id,
      );

      const listingsNearby = filterByDistance(listingsRaw, lat!, lng!, radiusKm, false);
      const profilesNearby = filterByDistance(profilesRaw, lat!, lng!, radiusKm, false);

      const now = Date.now();

      const listings: MapListingPin[] = listingsNearby.map((l: any) => {
        const imgs = Array.isArray(l.images) ? l.images : [];
        const first = imgs[0];
        return {
          id: l.id,
          title: l.title || 'Listing',
          price: l.price,
          category: l.category,
          city: l.city,
          bedrooms: l.bedrooms ?? undefined,
          bathrooms: l.bathrooms ?? undefined,
          lat: l.latitude,
          lng: l.longitude,
          imageUrl: first ? getCardImageUrl(first) : undefined,
          distanceKm: haversineKm(lat!, lng!, l.latitude, l.longitude),
        };
      });

      const profiles: MapProfilePin[] = profilesNearby.map((p: any) => {
        const imgs = Array.isArray(p.profile_images) ? p.profile_images : [];
        const first = typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url;
        const updatedAt = p.updated_at ? new Date(p.updated_at).getTime() : 0;
        return {
          id: p.user_id,
          name: p.name || 'User',
          city: p.city,
          bio: p.bio ?? undefined,
          age: p.age ?? undefined,
          occupation: p.occupation ?? undefined,
          lat: p.latitude,
          lng: p.longitude,
          imageUrl: first ? getCardImageUrl(first) : undefined,
          distanceKm: haversineKm(lat!, lng!, p.latitude, p.longitude),
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