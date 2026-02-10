
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
  service_type?: string;
  hourly_rate?: number;
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

          if (preferences?.preferred_listing_types?.length) {
            preferredListingTypes = preferences.preferred_listing_types;
          }
        }

        let query = supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false }); // Newest first

        // CRITICAL: Exclude own listings - user shouldn't see their own listings when browsing
        if (user.user) {
          query = query.neq('owner_id', user.user.id);
        }

        // Filter by listing types (rent/buy) based on user preferences
        if (preferredListingTypes.length > 0 && !preferredListingTypes.includes('both')) {
          query = query.in('listing_type', preferredListingTypes);
        }

        // Exclude swiped properties - use array directly for parameterized query
        if (excludeSwipedIds.length > 0) {
          query = query.not('id', 'in', `(${excludeSwipedIds.map(id => `"${id}"`).join(',')})`);
        }

        query = query.limit(20);

        const { data: listings, error } = await query;
        if (error) {
          if (import.meta.env.DEV) logger.error('Listings query error:', error);
          throw error;
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
          .eq('status', 'active')
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

    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

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
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
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

        // Only exclude listings swiped within the last 1 day (reset after next day)
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

        // Use correct column name 'target_id' with target_type='listing'
        const { data: likes, error } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.user.id)
          .eq('target_type', 'listing')
          .gte('created_at', oneDayAgo);

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
