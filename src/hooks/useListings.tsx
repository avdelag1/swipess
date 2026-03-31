
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  owner_id: string;
  description: string;
  status: string;

  // Mode and category
  category?: string;
  mode?: string;

  // Property fields
  address?: string;
  city?: string;
  neighborhood?: string;
  property_type?: string;
  beds?: number;
  baths?: number;
  square_footage?: number;
  furnished?: boolean;
  pet_friendly?: boolean;
  amenities?: string[];
  listing_type?: string;
  tulum_location?: string;
  lifestyle_compatible?: string[];

  // Common fields (vehicles)
  brand?: string;
  model?: string;
  year?: number;
  condition?: string;
  latitude?: number;
  longitude?: number;

  // Yacht fields
  length_m?: number;
  berths?: number;
  max_passengers?: number;
  hull_material?: string;
  engines?: string;
  fuel_type?: string;
  equipment?: string[];
  rental_rates?: any;

  // Motorcycle fields
  mileage?: number;
  engine_cc?: number;
  transmission?: string;
  color?: string;
  license_required?: string;
  vehicle_type?: string;

  // Bicycle fields
  frame_size?: string;
  wheel_size?: string;
  frame_material?: string;
  brake_type?: string;
  gear_type?: string;
  electric_assist?: boolean;
  battery_range?: number;

  // Worker/Service fields
  experience_years?: number;
  skills?: string[];
  certifications?: string[];
  service_category?: string;
  pricing_unit?: string;
  work_type?: string;
  schedule_type?: string;
  days_available?: string[];
  time_slots_available?: string[];
  location_type?: string;
  experience_level?: string;

  // Additional details
  description_short?: string;
  description_full?: string;

  // Timestamps
  updated_at?: string;
  created_at?: string;

  // Video
  video_url?: string | null;

  // New common fields
  rental_duration_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  has_verified_documents?: boolean | null;
  image_url?: string | null;
  provider_name?: string | null;
}

export function useListings(excludeSwipedIds: string[] = [], options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['listings', excludeSwipedIds, 'with-filters'],
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    queryFn: async () => {
      try {
        // Get current user's filter preferences for listing types
        const { data: user } = await supabase.auth.getUser();
        let preferredListingTypes = ['rent']; // Default to rent

        if (user.user) {
          const { data: preferences, error: prefError } = await supabase
            .from('client_filter_preferences')
            .select('preferred_listing_types')
            .eq('user_id', user.user.id)
            .maybeSingle();

          if (prefError) {
            if (import.meta.env.DEV) logger.error('Error fetching filter preferences:', prefError);
          }

          if ((preferences?.preferred_listing_types as any)?.length) {
            preferredListingTypes = (preferences as any).preferred_listing_types;
          }
        }

        // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
        // This is the "Materialized View" strategy: DB handles exclusion in one pass.
        try {
          const { data: rpcListings, error: rpcError } = await (supabase as any).rpc('get_smart_listings', {
            p_user_id: user?.user?.id,
            p_category: category === 'all' ? null : category,
            p_limit: 30, // Increased limit for consistent feed
            p_offset: 0
          });

          if (!rpcError && rpcListings && Array.isArray(rpcListings) && rpcListings.length > 0) {
            return (rpcListings as any[]).map(l => ({
                ...l,
                images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : [])
            })) as Listing[];
          }
        } catch (e) {
            // Fallback to PostgREST
        }

        // 2. BUILD SECURE POSTGREST QUERY (Fallback)
        let query = supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        // CRITICAL: Exclude own listings
        if (user.user) {
          query = query.neq('owner_id', user.user.id);
        }

        // URL SAFETY: Apply excluded IDs (Fallback only)
        if (excludeSwipedIds.length > 0) {
          const safeIds = excludeSwipedIds
            .filter(id => id && id.length > 30)
            .map(id => id.trim())
            .slice(0, 150); // URL SAFETY: Prevent 400
          if (safeIds.length > 0) {
            query = query.not('id', 'in', `(${safeIds.join(',')})`);
          }
        }

        const { data: listings, error } = await query.limit(20);
        if (error) {
          logger.error('Listings PostgREST error:', error);
          return [];
        }

        return (listings as Listing[]) || [];
      } catch (error) {
        if (import.meta.env.DEV) logger.error('Error in useListings:', error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }
    },
    enabled: options.enabled !== false,
    // PERF: Longer stale time for listings since they don't change frequently
    staleTime: 10 * 60 * 1000, // 10 minutes - listings are stable
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    retry: 3,
    retryDelay: 1000,
  });
}

// Hook for owners to view their own listings (no filtering by listing type)
export function useOwnerListings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-listings'],
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    queryFn: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          return [];
        }

        const { data: listings, error } = await supabase
          .from('listings')
          .select('*')
          .eq('owner_id', user.user.id)
          .order('created_at', { ascending: false })
          .limit(100); // Prevent loading too many listings at once

        if (error) {
          if (import.meta.env.DEV) logger.error('Owner listings query error:', error);
          throw error;
        }

        return (listings as Listing[]) || [];
      } catch (error) {
        if (import.meta.env.DEV) logger.error('Error in useOwnerListings:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Set up real-time subscription for listing changes
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user || !isMounted) return;

        // Subscribe to changes on the listings table for this user
        subscription = supabase
          .channel('owner-listings-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'listings',
              filter: `owner_id=eq.${user.user.id}`,
            },
            (payload) => {
              if (import.meta.env.DEV) logger.log('Real-time listing change:', payload);

              // Invalidate and refetch the listings query
              queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
            }
          )
          .subscribe();
      } catch (err) {
        logger.error('[useListings] Error setting up realtime subscription:', err);
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
        supabase.removeChannel(subscription);
      }
    };
  }, [queryClient]);

  return query;
}

export function useSwipedListings() {
  return useQuery({
    queryKey: ['swipes'],
    queryFn: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return [];

        // Fetch ALL-TIME swiped listings - permanent exclusion, no time limit
        const { data: likes, error } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.user.id)
          .eq('target_type', 'listing');

        if (error) {
          if (import.meta.env.DEV) logger.error('Swipes query error:', error);
          return [];
        }

        return likes?.map(l => l.target_id) || [];
      } catch (error) {
        if (import.meta.env.DEV) logger.error('Error in useSwipedListings:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });
}
