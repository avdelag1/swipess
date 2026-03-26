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

function deg2rad(deg: number) { return deg * (Math.PI / 180); }

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

<<<<<<< HEAD
                let query = supabase
                    .from('listings')
                    .select(SWIPE_CARD_FIELDS)
                    .eq('status', 'active')
                    .or(`owner_id.neq.${userId},owner_id.is.null`);
=======
                // 2. Query Listings
                let query = supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('is_active', true)
                    .neq('owner_id', userId!);
>>>>>>> a6cd3223 ( Swipess Concierge Titanium 5.1: Stabilized AI Backend & Corrected Smart Matching Filters)

                if (swipedListingIds.size > 0) {
                    const idList = Array.from(swipedListingIds)
                        .filter(id => id && typeof id === 'string' && id.length > 30)
                        .map(id => id.trim());
                    if (idList.length > 0) {
                        query = query.not('id', 'in', `(${idList.join(',')})`);
                    }
                }

                // Apply filters (Simplified for brevity)
                if (filters?.category) {
                    const normalized = normalizeCategoryName(filters.category);
                    if (normalized) {
                      query = query.eq('category', normalized);
                    }
                }

                const { data: listings, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                if (error) throw error;

                // Discovery Injection
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
<<<<<<< HEAD

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

                // Exclude own listings (defense in depth - check both owner_id and user_id)
                filteredListings = filteredListings.filter(listing => {
                    if (listing.owner_id === userId || (listing as any).user_id === userId) {
                        logger.warn('[SmartMatching] CRITICAL: Own listing leaked through DB query:', listing.id);
                        return false;
                    }
                    return true;
=======
>>>>>>> a6cd3223 ( Swipess Concierge Titanium 5.1: Stabilized AI Backend & Corrected Smart Matching Filters)
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
                logger.error('[SmartMatching] Fatal error:', err);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    });
}
