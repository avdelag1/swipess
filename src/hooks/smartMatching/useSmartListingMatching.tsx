import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { ListingFilters } from './types';
import { calculateListingMatch } from './matchCalculators';
import { pwaImagePreloader, getCardImageUrl } from '@/utils/imageOptimization';
import { runIdleTask } from '@/lib/utils';

export const SWIPE_CARD_FIELDS = `
  id, title, description, price, images, video_url, city, neighborhood, beds, baths,
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

    // 🚀 SPEED OF LIGHT: Cache user swipes globally to avoid repeated fetching
    const { data: userSwipes } = useQuery({
        queryKey: ['user-swipes', userId],
        queryFn: async () => {
            if (!userId) return { liked: new Set<string>(), left: new Map<string, string>() };
            const { data, error } = await supabase
                .from('likes')
                .select('target_id, direction, created_at')
                .eq('user_id', userId)
                .eq('target_type', 'listing');
            
            if (error) throw error;
            
            const liked = new Set<string>();
            const left = new Map<string, string>();
            data?.forEach(s => {
                if (s.direction === 'right') liked.add(s.target_id);
                else left.set(s.target_id, s.created_at);
            });
            return { liked, left };
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

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
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [];

            try {
                // 1. Prepare exclusion list from cache (if available)
                const swipedListingIds = new Set<string>();
                if (userSwipes) {
                  userSwipes.liked.forEach(id => swipedListingIds.add(id));
                  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                  userSwipes.left.forEach((createdAt, id) => {
                    const isOldSwipe = new Date(createdAt) < threeDaysAgo;
                    if (isOldSwipe || !isRefreshMode) {
                        swipedListingIds.add(id);
                    }
                  });
                }

                // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
                try {
                    const { data: rpcListings, error: rpcError } = await (supabase as any).rpc('get_smart_listings', {
                        p_user_id: userId,
                        p_category: (filtersKey.includes('"category":"all"') || !filters?.category) ? null : filters.category,
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcListings && Array.isArray(rpcListings) && rpcListings.length > 0) {
                        const results = (rpcListings as any[]).map(l => ({
                            ...l,
                            images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : [])
                        }));
                        
                        // 🔥 SPEED OF LIGHT: PRE-WARM IMAGES IMMEDIATELY (Hardware-Aware)
                        runIdleTask(() => {
                          const isHighPerformance = (navigator as any).deviceMemory >= 4 || !('deviceMemory' in navigator);
                          const imagesToPrewarm = results.flatMap(l => l.images || []).slice(0, isHighPerformance ? 25 : 10);
                          pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                        });

                        return results;
                    }
                } catch (_e) {
                    logger.warn('[SmartMatching] RPC Fallback to PostgREST');
                }

                // 2. BUILD SECURE POSTGREST QUERY (Fallback)
                let query = supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('status', 'active')
                    .neq('user_id', userId); // self-exclusion

                // 3. Apply excluded IDs (Fallback path)
                if (swipedListingIds.size > 0) {
                    const idList = Array.from(swipedListingIds)
                        .filter(id => id && id.length > 30)
                        .slice(0, 150);
                    if (idList.length > 0) {
                        query = query.filter('id', 'not.in', `(${idList.join(',')})`);
                    }
                }

                // 4. Apply Filters
                if (filters?.category && filters.category !== 'all') {
                    const normalized = normalizeCategoryName(filters.category);
                    if (normalized) query = query.eq('category', normalized);
                }

                if (filters?.serviceCategory && filters.serviceCategory.length > 0) {
                    query = query.in('service_category', filters.serviceCategory);
                }

                const { data: listings, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                if (error) throw error;

                // 5. Scoring & Sorting
                const matchedResults = (listings || []).map(listing => {
                    const match = calculateListingMatch((filters || {}) as any, listing as Listing);
                    return {
                        ...listing as Listing,
                        matchPercentage: match.percentage,
                        matchReasons: match.reasons,
                        incompatibleReasons: match.incompatible,
                    };
                });

                const finalResults = matchedResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

                // 🔥 SPEED OF LIGHT: PRE-WARM IMAGES IMMEDIATELY (Hardware-Aware)
                runIdleTask(() => {
                  const isHighPerformance = (navigator as any).deviceMemory >= 4 || !('deviceMemory' in navigator);
                  const imagesToPrewarm = finalResults.flatMap(l => l.images || []).slice(0, isHighPerformance ? 25 : 10);
                  pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                });

                return finalResults;

            } catch (err) {
                logger.error('[SmartMatching] Fatal Exception:', err);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    });
}


