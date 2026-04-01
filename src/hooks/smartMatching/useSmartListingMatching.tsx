import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { ListingFilters } from './types';
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
        staleTime: 5 * 60 * 1000, // 5 minutes (Real-time channel handles invalidation)
        gcTime: 1000 * 60 * 60,   // 1 hour
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [];

            try {
                // 1. Fetch user context and swiped IDs (Hardened against malformed UUIDs)
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
                    const isOldSwipe = new Date(s.created_at) < new Date(threeDaysAgo);
                    if (isOldSwipe || !isRefreshMode) {
                        swipedListingIds.add(s.target_id);
                    }
                });

                // 2. Build the main query (using is_active for stability)
                let query = supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('is_active', true)
                    .or(`owner_id.neq.${userId},owner_id.is.null`);

                // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
                // This is the "Materialized View" strategy: DB handles exclusion and JOINs in one pass.
                try {
                    const { data: rpcListings, error: rpcError } = await (supabase as any).rpc('get_smart_listings', {
                        p_user_id: userId,
                        p_category: (filters?.category === 'all' || !filters?.category) ? null : filters.category,
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcListings && Array.isArray(rpcListings) && rpcListings.length > 0) {
                        return (rpcListings as any[]).map(l => ({
                            ...l,
                            images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : [])
                        }));
                    }
                    if (rpcError) logger.warn('[SmartMatching] RPC Error:', rpcError.message);
                } catch {
                    logger.warn('[SmartMatching] RPC Fallback to PostgREST');
                }

                // 2. BUILD SECURE POSTGREST QUERY (Fallback)
                // Reuse existing query or reset it? The logic below expects a fresh query for PostgREST
                query = supabase.from('listings').select(SWIPE_CARD_FIELDS);

                // 3. Apply excluded IDs (Standard Array Filter - Prevents 400 Errors)
                if (swipedListingIds.size > 0) {
                    const idList = Array.from(swipedListingIds)
                        .filter(id => id && typeof id === 'string' && id.length > 30)
                        .map(id => id.trim())
                        .slice(0, 150); // URL SAFETY: Prevent 400
                    
                    if (idList.length > 0) {
                        query = query.filter('id', 'not.in', `(${idList.join(',')})`);
                    }
                }

                // 4. Apply Filters
                if (filters?.category && filters.category !== 'all') {
                    const normalized = normalizeCategoryName(filters.category);
                    if (normalized) query = query.eq('category', normalized);
                }

                // Fetch current page
                const { data: listings, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                if (error) {
                    logger.error('[SmartMatching] PostgREST Query Error:', error);
                    return [];
                }

                // 5. Discovery Injection (Array Filter Fallback)
                const discoveryExcludedIds = Array.from(swipedListingIds)
                    .filter(id => id && id.length > 30)
                    .map(id => id.trim())
                    .slice(0, 150); // URL SAFETY: Prevent 400
                
                const discoveryList = discoveryExcludedIds.length > 0 
                  ? `(${discoveryExcludedIds.join(',')})` 
                  : `(00000000-0000-0000-0000-000000000000)`;

                                const { data: discovery, error: discError } = await supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('is_active', true)
                    .or(`owner_id.neq.${userId},owner_id.is.null`)
                    .filter('id', 'not.in', discoveryList)
                    .order('created_at', { ascending: false })
                    .limit(2);

                if (discError) {
                    logger.error('[SmartMatching] Discovery fetch failed:', discError);
                }

                const finalResults = [...(listings || [])];
                discovery?.forEach(d => {
                    if (!finalResults.find(l => l.id === d.id)) {
                        (d as any)._isDiscovery = true;
                        finalResults.push(d);
                    }
                });

                // 6. Scoring & Sorting
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
                logger.error('[SmartMatching] Fatal Exception:', err);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    });
}
