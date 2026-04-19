import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useMapStore, DiscoverItem } from '../store/useMapStore';
import { useEffect } from 'react';

export function useSupabaseDiscovery() {
  const { dashboardMode, userLocation, radiusKm, activeFilters, seenItems } = useMapStore();

  const query = useQuery({
    queryKey: ['discovery', dashboardMode, userLocation, radiusKm, activeFilters],
    queryFn: async () => {
      if (!userLocation) return [];

      let supabaseQuery;
      
      if (dashboardMode === 'client') {
        // CLIENT MODE: Finding listings
        supabaseQuery = supabase
          .from('listings')
          .select('*')
          .eq('status', 'active');
        
        if (activeFilters.length > 0) {
          supabaseQuery = supabaseQuery.in('category', activeFilters);
        }
      } else {
        // OWNER MODE: Finding clients
        supabaseQuery = supabase
          .from('client_profiles')
          .select('*');
        
        if (activeFilters.length > 0) {
          // Client profiles might have 'preferred_categories'
          supabaseQuery = supabaseQuery.contains('preferred_categories', activeFilters);
        }
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      // Transform to unified DiscoverItem and filter by radius
      // Real-world: This should be a PostGIS query (rpc) for performance
      const mapped: DiscoverItem[] = (data || []).map((item: any) => ({
        id: item.id,
        type: dashboardMode === 'client' ? (item.type || 'listing') : 'user',
        title: item.title || item.full_name || 'Nearby Discovery',
        photo: item.images?.[0] || item.avatar_url || 'https://via.placeholder.com/150',
        lat: item.lat || item.latitude,
        lng: item.lng || item.longitude,
        distanceKm: calculateDistance(
          userLocation.lat, userLocation.lng,
          item.lat || item.latitude, item.lng || item.longitude
        ),
        category: item.category || 'general',
        isVerified: !!item.is_verified,
        isActive: true,
      }))
      .filter(item => item.distanceKm <= radiusKm)
      .filter(item => !seenItems.has(item.id));

      return mapped.sort((a, b) => a.distanceKm - b.distanceKm);
    },
    enabled: !!userLocation,
    staleTime: 1000 * 30, // 30s
  });

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('discovery_nexus')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: dashboardMode === 'client' ? 'listings' : 'client_profiles' }, 
      () => {
        query.refetch();
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [dashboardMode, query]);

  return query;
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
