import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { MatchedListing, ListingFilters, shuffleArray } from './types';
import { calculateListingMatch } from './matchCalculators';

// Worker fields added for complete card display
const SWIPE_CARD_FIELDS = `
  id, title, description, price, images, city, neighborhood, beds, baths,
  square_footage, category, listing_type, property_type, vehicle_brand,
  vehicle_model, year, mileage, amenities, pet_friendly, furnished,
  owner_id, created_at, currency,
  service_category, pricing_unit, experience_years, experience_level,
  skills, days_available, time_slots_available, work_type, schedule_type,
  location_type, service_radius_km, minimum_booking_hours,
  certifications, tools_equipment,
  offers_emergency_service, background_check_verified, insurance_verified,
  motorcycle_type, bicycle_type, engine_cc, fuel_type, transmission,
  electric_assist, battery_range, frame_size, frame_material
`;

/** Check if two JSONB arrays have any overlap */
function hasJsonOverlap(listingArr: unknown, filterArr: string[]): boolean {
  if (!Array.isArray(listingArr) || !filterArr.length) return false;
  const set = new Set(filterArr.map(s => s.toLowerCase()));
  return listingArr.some(v => typeof v === 'string' && set.has(v.toLowerCase()));
}

export function useSmartListingMatching(
    userId: string | undefined,
    excludeSwipedIds: string[] = [],
    filters?: ListingFilters,
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false
) {
    const filtersKey = filters ? JSON.stringify({
        category: filters.category,
        categories: filters.categories,
        listingType: filters.listingType,
        priceRange: filters.priceRange,
        propertyType: filters.propertyType,
        // Worker filter fields — included so filter changes trigger re-fetch
        serviceCategory: filters.serviceCategory,
        workTypes: filters.workTypes,
        daysAvailable: filters.daysAvailable,
        experienceLevel: filters.experienceLevel,
        skills: filters.skills,
        scheduleTypes: filters.scheduleTypes,
    }) : '';

    return useQuery({
        queryKey: ['smart-listings', userId, filtersKey, page, isRefreshMode],
        staleTime: 2 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) {
                logger.warn('[SmartMatching] No userId provided for listings, returning empty array');
                return [];
            }
            if (typeof userId !== 'string' || userId.trim() === '') {
                logger.error('[SmartMatching] Invalid userId for listings:', userId);
                return [];
            }

            try {
                logger.info('[SmartMatching] Fetching listings for user:', userId);

                const [
                    { data: preferences },
                    { data: likedListings, error: likesError },
                    { data: leftSwipes }
                ] = await Promise.all([
                    supabase.from('client_filter_preferences').select('*').eq('user_id', userId).maybeSingle(),
                    supabase.from('likes').select('target_id').eq('user_id', userId).eq('target_type', 'listing').eq('direction', 'right'),
                    supabase.from('likes').select('target_id, created_at').eq('user_id', userId).eq('target_type', 'listing').eq('direction', 'left')
                ]);

                const likedIds = new Set(!likesError ? (likedListings?.map(like => like.target_id) || []) : []);
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

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

                const swipedListingIds = new Set<string>();
                for (const id of likedIds) swipedListingIds.add(id);
                for (const id of permanentlyHiddenIds) swipedListingIds.add(id);
                if (!isRefreshMode) {
                    for (const id of refreshableDislikeIds) swipedListingIds.add(id);
                }

                let query = supabase
                    .from('listings')
                    .select(SWIPE_CARD_FIELDS)
                    .eq('status', 'active')
                    .neq('owner_id', userId);

                if (swipedListingIds.size > 0) {
                    const idsToExclude = Array.from(swipedListingIds);
                    query = query.not('id', 'in', `(${idsToExclude.join(',')})`);
                }

                query = query.order('created_at', { ascending: false });

                // Merge explicit UI filters with DB preferences as fallback
                const effectiveFilters = { ...filters } as any;

                if (preferences && (!effectiveFilters?.categories || effectiveFilters.categories.length === 0) && !effectiveFilters?.category) {
                    const dbCats = Array.isArray(preferences.preferred_categories) ? preferences.preferred_categories as string[] : [];
                    if (dbCats.length > 0) {
                        effectiveFilters.categories = dbCats.map((c: string) => normalizeCategoryName(c)).filter((c: string | undefined): c is string => !!c);
                    }
                }

                if (preferences && !effectiveFilters?.priceRange) {
                    const pMin = (preferences as any).price_min;
                    const pMax = (preferences as any).price_max;
                    if (pMin != null && pMax != null) {
                        effectiveFilters.priceRange = [Number(pMin), Number(pMax)];
                    }
                }

                if (effectiveFilters) {
                    logger.info('[SmartMatching] Applying filters:', {
                        categories: effectiveFilters.categories,
                        category: effectiveFilters.category,
                        listingType: effectiveFilters.listingType,
                    });

                    // Category filters
                    if (effectiveFilters.categories && effectiveFilters.categories.length > 0) {
                        const dbCategories = effectiveFilters.categories
                            .map((c: string) => normalizeCategoryName(c))
                            .filter((c: string | undefined): c is string => c !== undefined);
                        if (dbCategories.length > 0) {
                            query = query.in('category', dbCategories);
                        }
                    } else if (effectiveFilters.category) {
                        const dbCategory = normalizeCategoryName(typeof effectiveFilters.category === 'string' ? effectiveFilters.category : undefined);
                        if (dbCategory) {
                            query = query.eq('category', dbCategory);
                        }
                    }

                    // Listing type filter
                    if (effectiveFilters.listingType && effectiveFilters.listingType !== 'both') {
                        const mapping: Record<string, string> = { 'rent': 'rent', 'sale': 'buy' };
                        const dbListingType = mapping[effectiveFilters.listingType] || effectiveFilters.listingType;
                        query = query.eq('listing_type', dbListingType);
                    }

                    if (effectiveFilters.priceRange) {
                        query = query.gte('price', effectiveFilters.priceRange[0]).lte('price', effectiveFilters.priceRange[1]);
                    }

                    if (effectiveFilters.propertyType && effectiveFilters.propertyType.length > 0) {
                        query = query.in('property_type', effectiveFilters.propertyType);
                    }

                    if (effectiveFilters.bedrooms && effectiveFilters.bedrooms.length > 0) {
                        query = query.gte('beds', Math.min(...effectiveFilters.bedrooms));
                    }

                    if (effectiveFilters.bathrooms && effectiveFilters.bathrooms.length > 0) {
                        query = query.gte('baths', Math.min(...effectiveFilters.bathrooms));
                    }

                    // Worker-specific SQL filters (arrays → .in())
                    if (effectiveFilters.serviceCategory && effectiveFilters.serviceCategory.length > 0) {
                        query = query.in('service_category', effectiveFilters.serviceCategory);
                    }

                    if (effectiveFilters.experienceLevel && effectiveFilters.experienceLevel.length > 0) {
                        query = query.in('experience_level', effectiveFilters.experienceLevel);
                    }
                }

                // Pagination
                const start = page * pageSize;
                const end = start + pageSize - 1;
                const { data: listings, error } = await query.range(start, end);

                if (error) {
                    logger.error('[SmartMatching] Error fetching listings:', {
                        message: error.message, code: error.code, details: error.details, hint: error.hint,
                    });
                    return [];
                }

                if (!listings?.length) return [];

                // Client-side filters
                let filteredListings = listings as unknown as Listing[];

                // Amenities filter
                if (filters?.amenities && filters.amenities.length > 0) {
                    filteredListings = filteredListings.filter(listing => {
                        const listingAmenities = listing.amenities || [];
                        return filters.amenities!.some(amenity => listingAmenities.includes(amenity));
                    });
                }

                // Worker client-side filters (JSONB overlap checks)
                if (effectiveFilters?.workTypes && effectiveFilters.workTypes.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).work_type, effectiveFilters.workTypes)
                    );
                }
                if (effectiveFilters?.daysAvailable && effectiveFilters.daysAvailable.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).days_available, effectiveFilters.daysAvailable)
                    );
                }
                if (effectiveFilters?.skills && effectiveFilters.skills.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).skills, effectiveFilters.skills)
                    );
                }
                if (effectiveFilters?.scheduleTypes && effectiveFilters.scheduleTypes.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).schedule_type, effectiveFilters.scheduleTypes)
                    );
                }
                if (effectiveFilters?.timeSlotsAvailable && effectiveFilters.timeSlotsAvailable.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).time_slots_available, effectiveFilters.timeSlotsAvailable)
                    );
                }
                if (effectiveFilters?.locationTypes && effectiveFilters.locationTypes.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).location_type, effectiveFilters.locationTypes)
                    );
                }
                if (effectiveFilters?.certifications && effectiveFilters.certifications.length > 0) {
                    filteredListings = filteredListings.filter(l =>
                        hasJsonOverlap((l as any).certifications, effectiveFilters.certifications)
                    );
                }
                // Boolean verification filters
                if (effectiveFilters?.offersEmergencyService) {
                    filteredListings = filteredListings.filter(l => (l as any).offers_emergency_service === true);
                }
                if (effectiveFilters?.backgroundCheckVerified) {
                    filteredListings = filteredListings.filter(l => (l as any).background_check_verified === true);
                }
                if (effectiveFilters?.insuranceVerified) {
                    filteredListings = filteredListings.filter(l => (l as any).insurance_verified === true);
                }

                // Exclude own listings (defense in depth)
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

                // Premium tier boost
                const ownerIds = Array.from(new Set(filteredListings.map(l => l.owner_id)));
                const { data: ownerSubscriptions } = await supabase
                    .from('user_subscriptions')
                    .select(`user_id, subscription_packages ( tier )`)
                    .in('user_id', ownerIds)
                    .eq('is_active', true);

                const ownerTierMap: Record<string, string> = {};
                ownerSubscriptions?.forEach((sub: any) => {
                    ownerTierMap[sub.user_id] = sub.subscription_packages?.tier || 'free';
                });

                const boostMap: Record<string, number> = {
                    unlimited: 1.0, premium_plus: 0.8, premium: 0.5, basic: 0.25, free: 0
                };

                const matchedListings: MatchedListing[] = filteredListings.map(listing => {
                    const match = calculateListingMatch(preferences as any, listing as Listing);
                    const tier = ownerTierMap[listing.owner_id] || 'free';
                    return {
                        ...listing as Listing,
                        matchPercentage: match.percentage,
                        matchReasons: match.reasons,
                        incompatibleReasons: match.incompatible,
                        _premiumTier: tier,
                        _visibilityBoost: boostMap[tier] || 0
                    };
                });

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

                const tierGroups: Record<string, MatchedListing[]> = {
                    unlimited: [], premium_plus: [], premium: [], basic: [], free: []
                };

                sortedListings.forEach(listing => {
                    const tier = (listing as any)._premiumTier || 'free';
                    if (!tierGroups[tier]) tierGroups[tier] = [];
                    tierGroups[tier].push(listing);
                });

                const sortByDate = (a: MatchedListing, b: MatchedListing) => {
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                };

                const randomizedListings = [
                    ...tierGroups.unlimited.sort(sortByDate),
                    ...tierGroups.premium_plus.sort(sortByDate),
                    ...tierGroups.premium.sort(sortByDate),
                    ...tierGroups.basic.sort(sortByDate),
                    ...tierGroups.free.sort(sortByDate)
                ];

                if (randomizedListings.length === 0 && filteredListings.length > 0) {
                    return shuffleArray(filteredListings.map(listing => ({
                        ...listing as Listing,
                        matchPercentage: 20,
                        matchReasons: ['General listing'],
                        incompatibleReasons: []
                    })));
                }

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
