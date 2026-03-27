import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { MatchedListing, ListingFilters, shuffleArray } from './types';
import { calculateListingMatch } from './matchCalculators';

const SWIPE_CARD_FIELDS = `
  id, title, description, price, images, city, neighborhood, beds, baths,
  square_footage, category, listing_type, property_type, vehicle_brand,
  vehicle_model, year, mileage, amenities, pet_friendly, furnished,
  owner_id, user_id, created_at, currency,
  service_category, pricing_unit, experience_years, experience_level,
  skills, days_available, time_slots_available, work_type, schedule_type,
  location_type, service_radius_km, minimum_booking_hours,
  certifications, tools_equipment,
  offers_emergency_service, background_check_verified, insurance_verified,
  motorcycle_type, bicycle_type, engine_cc, fuel_type, transmission,
  electric_assist, battery_range, frame_size, frame_material,
  latitude, longitude, status, is_active
`;

export function useSmartListingMatching(
    userId: string | undefined,
    _excludeSwipedIds: string[] = [],
    filters?: ListingFilters,
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false
) {
    const queryClient = useQueryClient();
    const filtersKey = filters ? JSON.stringify(filters) : '';

    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel('listings-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, () => {
                logger.info('[SmartMatching] New listing inserted, invalidating queries');
                queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
            })
            .subscribe();
        return () => { channel.unsubscribe(); };
    }, [userId, queryClient]);

    return useQuery({
        queryKey: ['smart-listings', userId, filtersKey, page, isRefreshMode],
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [];

            try {
                // 1. Fetch user context and swiped IDs
                const [
                    { data: likedListings },
                    { data: leftSwipes }
                ] = await Promise.all([
                    supabase.from('likes').select('target_id').eq('user_id', userId).eq('target_type', 'listing').eq('direction', 'right'),
                    supabase.from('likes').select('target_id, created_at').eq('user_id', userId).eq('target_type', 'listing').eq('direction', 'left')
                ]);

                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
                const swipedListingIds = new Set<string>();
                likedListings?.forEach(l => swipedListingIds.add(l.target_id));
                leftSwipes?.forEach(s => {
                    if (new Date(s.created_at) < new Date(threeDaysAgo)) {
                        swipedListingIds.add(s.target_id);
                    } else if (!isRefreshMode) {
                        swipedListingIds.add(s.target_id);
                    }
                });

                // 2. Query Listings
                let query = supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('is_active', true)
                    .neq('owner_id', userId!)
                    .or(`owner_id.neq.${userId},owner_id.is.null`);

                if (swipedListingIds.size > 0) {
                    const idList = Array.from(swipedListingIds)
                        .filter(id => id && typeof id === 'string' && id.length > 30)
                        .map(id => id.trim());
                    if (idList.length > 0) {
                        query = query.not('id', 'in', `(${idList.join(',')})`);
                    }
                }

                // 3. Apply Professional Filters
                if (filters?.category) {
                    const normalized = normalizeCategoryName(filters.category);
                    if (normalized) query = query.eq('category', normalized);
                }

                if (filters?.priceRange) {
                    query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
                }

                if (filters?.propertyType && filters.propertyType.length > 0) {
                    query = query.in('property_type', filters.propertyType);
                }

                if (filters?.listingType && filters.listingType !== 'both') {
                    const mapping: Record<string, string> = { 'rent': 'rent', 'sale': 'buy' };
                    query = query.eq('listing_type', mapping[filters.listingType] || filters.listingType);
                }

                // Discovery Injection & Range Fetch
                const start = page * pageSize;
                const end = start + pageSize - 1;
                const { data: listings, error } = await query.range(start, end);
                if (error) throw error;

                // Discovery Injection (Parallel check for the newest matching listings)
                const validSwipedList = Array.from(swipedListingIds)
                    .filter(id => id && typeof id === 'string' && id.length > 30)
                    .map(id => id.trim());
                
                const swipeInClause = validSwipedList.length > 0 
                  ? `(${validSwipedList.join(',')})` 
                  : `(00000000-0000-0000-0000-000000000000)`;

                const { data: discovery } = await supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('is_active', true)
                    .neq('owner_id', userId!)
                    .not('id', 'in', swipeInClause)
                    .order('created_at', { ascending: false })
                    .limit(2);

                const finalResults = [...(listings || [])];
                discovery?.forEach(d => {
                    if (!finalResults.find(l => l.id === d.id)) {
                        (d as any)._isDiscovery = true;
                        finalResults.push(d);
                    }
                });

                // Scoring
                const matchedResults = finalResults.map(listing => {
                    const match = calculateListingMatch((filters || {}) as any, listing as Listing);
                    return {
                        ...listing as Listing,
                        matchPercentage: match.percentage,
                        matchReasons: match.reasons,
                        incompatibleReasons: match.incompatible,
                    };
                });

                return matchedResults.sort((a, b) => {
                    if ((a as any)._isDiscovery && !(b as any)._isDiscovery) return -1;
                    if (!(a as any)._isDiscovery && (b as any)._isDiscovery) return 1;
                    return b.matchPercentage - a.matchPercentage;
                });

            } catch (err) {
                logger.error('[SmartMatching] Fatal error in useSmartListingMatching:', err);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    });
}
