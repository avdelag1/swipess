import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { ListingFilters } from './types';
import { calculateListingMatch } from './matchCalculators';
import { pwaImagePreloader, getCardImageUrl } from '@/utils/imageOptimization';
import { runIdleTask } from '@/lib/utils';
import { useAdminUserIds } from '../useAdminUserIds';

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
    const { data: adminIds } = useAdminUserIds();

    // 🚀 SPEED OF LIGHT: Cache user swipes globally to avoid repeated fetching
    const { data: userSwipes } = useQuery({
        queryKey: ['user-swipes', userId],
        queryFn: async () => {
            if (!userId) return { liked: new Set<string>(), left: new Map<string, string>(), strikes: new Map<string, { count: number, lastAt: string }>() };
            
            // Fetch likes
            const { data: likes, error: likesError } = await supabase
                .from('likes')
                .select('target_id, direction, created_at')
                .eq('user_id', userId)
                .eq('target_type', 'listing');
            
            if (likesError) throw likesError;

            // Fetch strikes (profile_views)
            const { data: views, error: viewsError } = await supabase
                .from('profile_views')
                .select('viewed_profile_id, action, created_at')
                .eq('user_id', userId)
                .eq('view_type', 'listing');
            
            if (viewsError) throw viewsError;
            
            const liked = new Set<string>();
            const left = new Map<string, string>();
            const strikes = new Map<string, { count: number, lastAt: string }>();

            likes?.forEach(s => {
                if (s.direction === 'right') liked.add(s.target_id);
                else left.set(s.target_id, s.created_at);
            });

            views?.forEach(v => {
                if (v.action.startsWith('pass:')) {
                    const count = parseInt(v.action.split(':')[1]) || 1;
                    strikes.set(v.viewed_profile_id, { count, lastAt: v.created_at });
                }
            });

            return { liked, left, strikes };
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    // 📡 REAL-TIME SYNC: Invalidate listing cache when new items are added
    // Throttle to prevent hammer-looping if multiple listings are added quickly
    const lastInvalidateRef = useRef<number>(0);
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`smart-listings-sync-${userId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'listings' 
            }, (payload) => {
                const now = Date.now();
                if (now - lastInvalidateRef.current < 10000) return; // 10s cooldown
                lastInvalidateRef.current = now;
                
                logger.info('[SmartMatching] New listing detected, refreshing cache...');
                queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
            })
            .subscribe();
        return () => { channel.unsubscribe(); };
    }, [userId, queryClient]);

    const filtersKey = useMemo(() => {
        try {
            return JSON.stringify(filters || {});
        } catch {
            return 'invalid-filters';
        }
    }, [filters]);

    // STABILITY FIX: Detect if filters changed but the reference stayed the same (or vice versa)
    const prevFiltersKeyRef = useRef(filtersKey);
    const prevUserIdRef = useRef(userId);
    const prevIsRefreshModeRef = useRef(isRefreshMode);

    if (filtersKey !== prevFiltersKeyRef.current || userId !== prevUserIdRef.current || isRefreshMode !== prevIsRefreshModeRef.current) {
        logger.info('[useSmartListingMatching] Refetch Trigger Detected:', {
            filtersChanged: filtersKey !== prevFiltersKeyRef.current,
            userChanged: userId !== prevUserIdRef.current,
            refreshModeChanged: isRefreshMode !== prevIsRefreshModeRef.current,
            page
        });
        prevFiltersKeyRef.current = filtersKey;
        prevUserIdRef.current = userId;
        prevIsRefreshModeRef.current = isRefreshMode;
    }

    const queryKey = useMemo(() => [
        'smart-listings', 
        userId, 
        filtersKey, 
        page, 
        pageSize,
        isRefreshMode
    ], [userId, filtersKey, page, pageSize, isRefreshMode]);

    return useQuery({
        queryKey: queryKey,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [];

            try {
                // 1. Prepare exclusion list from cache (if available)
                const swipedListingIds = new Set<string>();
                if (userSwipes) {
                  // 1. Always exclude liked items
                  userSwipes.liked.forEach(id => swipedListingIds.add(id));
                  
                  // 2. Apply 3-strike progressive exclusion for dislikes
                  userSwipes.left.forEach((createdAt, id) => {
                    const strike = userSwipes.strikes.get(id);
                    const strikeCount = strike?.count || 1;
                    
                    let timeoutDays = 3;
                    if (strikeCount === 2) timeoutDays = 7;
                    if (strikeCount >= 3) timeoutDays = 36500; // 100 years = forever

                    const timeoutMs = timeoutDays * 24 * 60 * 60 * 1000;
                    const isTimedOut = new Date(createdAt).getTime() + timeoutMs > Date.now();
                    
                    // If refresh mode is ON, we only exclude "forever" items (strike 3)
                    // If refresh mode is OFF, we exclude any active timeout
                    if (strikeCount >= 3) {
                      swipedListingIds.add(id);
                    } else if (!isRefreshMode && isTimedOut) {
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
                        const results = (rpcListings as any[])
                            .filter(l => !adminIds?.has(l.user_id))
                            .map(l => ({
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

                // 4.5 Filter out Admins (Hardware-Accelerated Client-Side Filter)
                const filteredListings = (listings || []).filter(listing => !adminIds?.has(listing.user_id));

                // 5. Scoring, Sorting, and Update Recovery
                const matchedResults = filteredListings.map(listing => {
                    const match = calculateListingMatch((filters || {}) as any, listing as Listing);
                    
                    // CHECK FOR RECOVERY: If this listing was swiped but updated since, it should bypass exclusion
                    // Note: In a real app we'd use updated_at, but using created_at/metadata check here
                    const swipe = userSwipes?.left.get(listing.id);
                    const isUpdated = swipe && new Date(listing.created_at) > new Date(swipe);
                    
                    return {
                        ...listing as Listing,
                        matchPercentage: isUpdated ? Math.min(match.percentage + 10, 100) : match.percentage, // Boost updated ones
                        matchReasons: isUpdated ? ['Recently Updated', ...match.reasons] : match.reasons,
                        incompatibleReasons: match.incompatible,
                        isUpdatedRecovery: !!isUpdated
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


