import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { MatchedListing, ListingFilters, shuffleArray } from './types';
import { calculateListingMatch } from './matchCalculators';

export function useSmartListingMatching(
    userId: string | undefined, // PERF: Accept userId to avoid getUser() inside queryFn
    excludeSwipedIds: string[] = [],
    filters?: ListingFilters,
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false // When true, show disliked items within cooldown
) {
    // Memoize filters key to prevent unnecessary cache misses
    const filtersKey = filters ? JSON.stringify({
        category: filters.category,
        categories: filters.categories,
        listingType: filters.listingType,
        priceRange: filters.priceRange,
        propertyType: filters.propertyType,
    }) : '';

    return useQuery({
        queryKey: ['smart-listings', userId, filtersKey, page, isRefreshMode], // Stable query key with userId
        // PERF: Longer stale time for listings since they don't change frequently
        staleTime: 2 * 60 * 1000, // 2 minutes - ensure swiped cards stay excluded
        gcTime: 15 * 60 * 1000, // 15 minutes cache time
        // PERF: Keep previous data while fetching new data to prevent UI flash
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            // PERF: userId is passed in, no need for async getUser() call
            if (!userId) {
                logger.warn('[SmartMatching] No userId provided for listings, returning empty array');
                return [];
            }

            // CRITICAL: Defensive check - ensure userId is valid
            if (typeof userId !== 'string' || userId.trim() === '') {
                logger.error('[SmartMatching] Invalid userId for listings:', userId);
                return [];
            }

            try {
                logger.info('[SmartMatching] Fetching listings for user:', userId);

                const { data: preferences } = await supabase
                    .from('client_filter_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                // Fetch liked items (right swipes) - these are NEVER shown again
                const { data: likedListings, error: likesError } = await supabase
                    .from('likes')
                    .select('target_id')
                    .eq('user_id', userId)
                    .eq('target_type', 'listing')
                    .eq('direction', 'right');

                const likedIds = new Set(!likesError ? (likedListings?.map(like => like.target_id) || []) : []);

                // Fetch left swipes with timestamps for 3-day expiry logic
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

                const { data: leftSwipes } = await supabase
                    .from('likes')
                    .select('target_id, created_at')
                    .eq('user_id', userId)
                    .eq('target_type', 'listing')
                    .eq('direction', 'left');

                // Build sets for dislike handling
                const permanentlyHiddenIds = new Set<string>();
                const refreshableDislikeIds = new Set<string>();

                if (leftSwipes) {
                    for (const swipe of leftSwipes) {
                        const swipeDate = new Date(swipe.created_at);
                        const threeDaysAgoDate = new Date(threeDaysAgo);

                        if (swipeDate < threeDaysAgoDate) {
                            permanentlyHiddenIds.add(swipe.target_id);
                        } else {
                            refreshableDislikeIds.add(swipe.target_id);
                        }
                    }
                }

                // Build set of IDs to exclude based on mode
                const swipedListingIds = new Set<string>();

                for (const id of likedIds) {
                    swipedListingIds.add(id);
                }
                for (const id of permanentlyHiddenIds) {
                    swipedListingIds.add(id);
                }
                if (!isRefreshMode) {
                    for (const id of refreshableDislikeIds) {
                        swipedListingIds.add(id);
                    }
                }

                // Build query with filters
                const SWIPE_CARD_FIELDS = `
          id, title, price, images, image_url, city, neighborhood, beds, baths,
          square_footage, category, listing_type, property_type, vehicle_brand,
          vehicle_model, year, mileage, amenities, pet_friendly, furnished,
          owner_id, created_at
        `;

                let query = (supabase as any)
                    .from('listings')
                    .select(SWIPE_CARD_FIELDS)
                    .eq('status', 'active')
                    .neq('owner_id', userId); // CRITICAL: Exclude own listings

                // Exclude swiped listings at SQL level
                if (swipedListingIds.size > 0) {
                    const idsToExclude = Array.from(swipedListingIds);
                    query = query.not('id', 'in', `(${idsToExclude.map(id => `"${id}"`).join(',')})`);
                }

                query = query.order('created_at', { ascending: false });

                // Apply filter-based query constraints
                if (filters) {
                    logger.info('[SmartMatching] Applying filters:', {
                        categories: filters.categories,
                        category: filters.category,
                        listingType: filters.listingType,
                    });

                    if (filters.categories && filters.categories.length > 0) {
                        const dbCategories = filters.categories.map(c => normalizeCategoryName(c)).filter((c): c is string => c !== undefined);
                        query = query.in('category', dbCategories);
                    } else if (filters.category) {
                        const dbCategory = normalizeCategoryName(filters.category);
                        if (dbCategory) {
                            query = query.eq('category', dbCategory);
                        }
                    }

                    if (filters.listingType && filters.listingType !== 'both') {
                        query = query.eq('listing_type', filters.listingType);
                    }

                    if (filters.priceRange) {
                        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
                    }

                    if (filters.propertyType && filters.propertyType.length > 0) {
                        query = query.in('property_type', filters.propertyType);
                    }

                    if (filters.bedrooms && filters.bedrooms.length > 0) {
                        const minBeds = Math.min(...filters.bedrooms);
                        query = query.gte('beds', minBeds);
                    }

                    if (filters.bathrooms && filters.bathrooms.length > 0) {
                        const minBaths = Math.min(...filters.bathrooms);
                        query = query.gte('baths', minBaths);
                    }
                }

                // Apply pagination
                const start = page * pageSize;
                const end = start + pageSize - 1;
                const { data: listings, error } = await query.range(start, end);

                if (error) {
                    logger.error('[SmartMatching] Error fetching listings:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                    });
                    return [];
                }

                if (!listings?.length) {
                    return [];
                }

                // Apply client-side filters for amenities
                let filteredListings = listings as unknown as Listing[];
                if (filters?.amenities && filters.amenities.length > 0) {
                    filteredListings = filteredListings.filter(listing => {
                        const listingAmenities = listing.amenities || [];
                        return filters.amenities!.some(amenity => listingAmenities.includes(amenity));
                    });
                }

                // DEFENSE IN DEPTH: Double-check own listings excluded
                filteredListings = filteredListings.filter(listing => {
                    if (listing.owner_id === userId) {
                        logger.warn('[SmartMatching] CRITICAL: Own listing leaked through DB query:', listing.id);
                        return false;
                    }
                    return true;
                });

                if (!preferences) {
                    return filteredListings.map(listing => ({
                        ...listing,
                        matchPercentage: 50,
                        matchReasons: ['No preferences set'],
                        incompatibleReasons: []
                    }));
                }

                // Calculate match percentage for each listing
                const matchedListings: MatchedListing[] = filteredListings.map(listing => {
                    const match = calculateListingMatch(preferences as any, listing as Listing);
                    return {
                        ...listing as Listing,
                        matchPercentage: match.percentage,
                        matchReasons: match.reasons,
                        incompatibleReasons: match.incompatible,
                        _premiumTier: 'free',
                        _visibilityBoost: 0
                    };
                });

                // Sort by premium tier first, then match percentage
                const tierOrder: Record<string, number> = {
                    unlimited: 1, premium_plus: 2, premium: 3, basic: 4, free: 5
                };

                const sortedListings = matchedListings
                    .filter(listing => listing.matchPercentage >= 0)
                    .sort((a, b) => {
                        const tierA = tierOrder[(a as any)._premiumTier] || 5;
                        const tierB = tierOrder[(b as any)._premiumTier] || 5;
                        if (tierA !== tierB) return tierA - tierB;
                        return b.matchPercentage - a.matchPercentage;
                    });

                // Group by tier and sort by date within each
                const tierGroups: Record<string, MatchedListing[]> = {
                    unlimited: [], premium_plus: [], premium: [], basic: [], free: []
                };

                sortedListings.forEach(listing => {
                    const tier = (listing as any)._premiumTier || 'free';
                    if (!tierGroups[tier]) tierGroups[tier] = [];
                    tierGroups[tier].push(listing);
                });

                const sortByDate = (a: MatchedListing, b: MatchedListing) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                };

                const randomizedListings = [
                    ...tierGroups.unlimited.sort(sortByDate),
                    ...tierGroups.premium_plus.sort(sortByDate),
                    ...tierGroups.premium.sort(sortByDate),
                    ...tierGroups.basic.sort(sortByDate),
                    ...tierGroups.free.sort(sortByDate)
                ];

                // Fallback: if no matches found but we have listings
                if (randomizedListings.length === 0 && filteredListings.length > 0) {
                    const fallbackListings = filteredListings.map(listing => ({
                        ...listing as Listing,
                        matchPercentage: 20,
                        matchReasons: ['General listing'],
                        incompatibleReasons: []
                    }));
                    return shuffleArray(fallbackListings);
                }

                // Verify none of the returned listings are the user's own
                const hasOwnListing = randomizedListings.some(l => l.owner_id === userId);
                if (hasOwnListing) {
                    logger.error('[SmartMatching] CRITICAL BUG: User\'s own listing in results!');
                    return randomizedListings.filter(l => l.owner_id !== userId);
                }

                return randomizedListings;
            } catch (error) {
                logger.error('Error in smart listing matching:', error);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
        refetchOnMount: 'always' as const,
        refetchOnReconnect: false,
        retry: 1,
        retryDelay: 1000,
    });
}
