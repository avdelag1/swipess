import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { filterByDistance } from '@/utils/matchingFilters';
import { getCardImageUrl } from '@/utils/imageOptimization';

export interface MapListingPin {
  id: string;
  title: string;
  price?: number;
  category?: string;
  city?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

export interface MapProfilePin {
  id: string;
  name: string;
  city?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

export function usePassportMapData(
  lat: number | null,
  lng: number | null,
  radiusKm: number,
) {
  return useQuery({
    queryKey: ['passport-map-data', lat, lng, radiusKm],
    enabled: lat != null && lng != null,
    staleTime: 60_000,
    queryFn: async () => {
      const [listingsRes, profilesRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id, title, price, images, category, city, latitude, longitude')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .or('is_active.eq.true,is_active.is.null')
          .limit(300),
        supabase
          .from('client_profiles')
          .select('user_id, name, city, latitude, longitude, profile_images')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(300),
      ]);

      const listingsRaw = listingsRes.data || [];
      const profilesRaw = profilesRes.data || [];

      const listingsNearby = filterByDistance(listingsRaw, lat!, lng!, radiusKm, false);
      const profilesNearby = filterByDistance(profilesRaw, lat!, lng!, radiusKm, false);

      const listings: MapListingPin[] = listingsNearby.map((l: any) => {
        const imgs = Array.isArray(l.images) ? l.images : [];
        const first = imgs[0];
        return {
          id: l.id,
          title: l.title || 'Listing',
          price: l.price,
          category: l.category,
          city: l.city,
          lat: l.latitude,
          lng: l.longitude,
          imageUrl: first ? getCardImageUrl(first) : undefined,
        };
      });

      const profiles: MapProfilePin[] = profilesNearby.map((p: any) => {
        const imgs = Array.isArray(p.profile_images) ? p.profile_images : [];
        const first = typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url;
        return {
          id: p.user_id,
          name: p.name || 'User',
          city: p.city,
          lat: p.latitude,
          lng: p.longitude,
          imageUrl: first ? getCardImageUrl(first) : undefined,
        };
      });

      return { listings, profiles };
    },
  });
}