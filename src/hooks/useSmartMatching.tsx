import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Listing } from './useListings';
import { ClientFilterPreferences } from './useClientFilterPreferences';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';

// Fisher-Yates shuffle algorithm for randomizing array order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to check if images contain mock/fake/placeholder URLs
function hasMockImages(images: string[] | null | undefined): boolean {
  if (!images || images.length === 0) return false;

  const mockPatterns = [
    'placeholder',
    'mock',
    'test',
    'example.com',
    'unsplash.com',
    'picsum.photos',
    'loremflickr.com',
    'dummyimage.com',
    'via.placeholder.com'
  ];

  return images.some(imageUrl => {
    if (!imageUrl) return false;
    const lowerUrl = imageUrl.toLowerCase();
    return mockPatterns.some(pattern => lowerUrl.includes(pattern));
  });
}

export interface MatchedListing extends Listing {
  matchPercentage: number;
  matchReasons: string[];
  incompatibleReasons: string[];
}

export interface MatchedClientProfile {
  id: number;
  user_id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  preferred_activities: string[];
  location: any;
  lifestyle_tags: string[];
  profile_images: string[];
  preferred_listing_types?: string[];
  budget_min?: number;
  budget_max?: number;
  matchPercentage: number;
  matchReasons: string[];
  incompatibleReasons: string[];
  city?: string;
  country?: string;
  avatar_url?: string;
  verified?: boolean;
  work_schedule?: string;
  nationality?: string;
  languages?: string[];
  neighborhood?: string;

  // Category-specific preferences
  moto_types?: string[];
  bicycle_types?: string[];
  budget?: { min?: number; max?: number };
}

// Filters that can be applied to client profiles
export interface ClientFilters {
  budgetRange?: [number, number];
  ageRange?: [number, number];
  genders?: string[];
  hasPets?: boolean;
  smoking?: boolean;
  partyFriendly?: boolean;
  interests?: string[];
  lifestyleTags?: string[];
  verified?: boolean;
  // Additional demographic filters
  nationalities?: string[];
  languages?: string[];
  relationshipStatus?: string[];
  // Category-specific
  motoTypes?: string[];
  bicycleTypes?: string[];
  propertyTypes?: string[]; // For property-seeking clients
}

// Calculate match percentage between client preferences and listing
function calculateListingMatch(preferences: ClientFilterPreferences, listing: Listing): {
  percentage: number;
  reasons: string[];
  incompatible: string[];
} {
  const criteria = [];
  const matchedReasons = [];
  const incompatibleReasons = [];

  // Critical filters (listing type) - if this fails, show 0% match
  if (preferences.preferred_listing_types?.length) {
    if (!preferences.preferred_listing_types.includes(listing.listing_type || 'rent')) {
      return {
        percentage: 0,
        reasons: [],
        incompatible: [`Looking for ${preferences.preferred_listing_types.join('/')} but this is for ${listing.listing_type}`]
      };
    }
    matchedReasons.push(`Matches ${listing.listing_type} preference`);
  }

  // Price range matching with 20% flexibility
  if (preferences.min_price && preferences.max_price) {
    const priceFlexibility = 0.2;
    const adjustedMinPrice = preferences.min_price * (1 - priceFlexibility);
    const adjustedMaxPrice = preferences.max_price * (1 + priceFlexibility);
    const priceInRange = listing.price >= adjustedMinPrice && listing.price <= adjustedMaxPrice;
    criteria.push({
      weight: 20,
      matches: priceInRange,
      reason: `Price $${listing.price} within flexible budget`,
      incompatibleReason: `Price $${listing.price} outside flexible budget range`
    });
  }

  // Bedrooms matching
  if (preferences.min_bedrooms && preferences.max_bedrooms) {
    criteria.push({
      weight: 15,
      matches: listing.beds >= preferences.min_bedrooms && listing.beds <= preferences.max_bedrooms,
      reason: `${listing.beds} beds matches requirement (${preferences.min_bedrooms}-${preferences.max_bedrooms})`,
      incompatibleReason: `${listing.beds} beds outside range (${preferences.min_bedrooms}-${preferences.max_bedrooms})`
    });
  }

  // Bathrooms matching
  if (preferences.min_bathrooms) {
    criteria.push({
      weight: 10,
      matches: listing.baths >= preferences.min_bathrooms,
      reason: `${listing.baths} baths meets minimum ${preferences.min_bathrooms}`,
      incompatibleReason: `Only ${listing.baths} baths, need minimum ${preferences.min_bathrooms}`
    });
  }

  // Property type matching - only check if listing has property_type
  if (preferences.property_types?.length && listing.property_type) {
    criteria.push({
      weight: 15,
      matches: preferences.property_types.includes(listing.property_type),
      reason: `Property type ${listing.property_type} matches preferences`,
      incompatibleReason: `Property type ${listing.property_type} not in preferred types`
    });
  }

  // Pet friendly matching
  if (preferences.pet_friendly_required) {
    criteria.push({
      weight: 12,
      matches: listing.pet_friendly,
      reason: 'Pet-friendly property',
      incompatibleReason: 'Not pet-friendly but pets required'
    });
  }

  // Furnished matching
  if (preferences.furnished_required) {
    criteria.push({
      weight: 10,
      matches: listing.furnished,
      reason: 'Furnished property',
      incompatibleReason: 'Not furnished but furnished required'
    });
  }

  // Location zone matching - only check if listing has location data
  if (preferences.location_zones?.length && (listing.tulum_location || listing.neighborhood)) {
    criteria.push({
      weight: 18,
      matches: preferences.location_zones.some(zone =>
        listing.tulum_location?.toLowerCase()?.includes(zone.toLowerCase()) ||
        listing.neighborhood?.toLowerCase()?.includes(zone.toLowerCase())
      ),
      reason: `Location matches preferred zones`,
      incompatibleReason: `Location not in preferred zones`
    });
  } else if (preferences.location_zones?.length && !listing.tulum_location && !listing.neighborhood) {
    // Don't penalize listings without location data
    criteria.push({
      weight: 18,
      matches: true,
      reason: 'Location not specified',
      incompatibleReason: ''
    });
  }

  // Amenities matching
  if (preferences.amenities_required?.length) {
    const matchingAmenities = listing.amenities?.filter(amenity => 
      preferences.amenities_required?.includes(amenity)
    ) || [];
    const amenityMatchRate = matchingAmenities.length / preferences.amenities_required.length;
    
    criteria.push({
      weight: 10,
      matches: amenityMatchRate >= 0.5, // At least 50% of required amenities
      reason: `${matchingAmenities.length}/${preferences.amenities_required.length} required amenities available`,
      incompatibleReason: `Only ${matchingAmenities.length}/${preferences.amenities_required.length} required amenities available`
    });
  }

  // Calculate weighted percentage
  let totalWeight = 0;
  let matchedWeight = 0;

  criteria.forEach(criterion => {
    totalWeight += criterion.weight;
    if (criterion.matches) {
      matchedWeight += criterion.weight;
      matchedReasons.push(criterion.reason);
    } else {
      incompatibleReasons.push(criterion.incompatibleReason);
    }
  });

  const percentage = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 100;

  return {
    percentage,
    reasons: matchedReasons,
    incompatible: incompatibleReasons
  };
}

export interface ListingFilters {
  category?: 'property' | 'motorcycle' | 'bicycle' | 'services' | 'worker';
  categories?: ('property' | 'motorcycle' | 'bicycle' | 'services' | 'worker')[]; // Support multiple categories
  listingType?: 'rent' | 'sale' | 'both';
  propertyType?: string[];
  priceRange?: [number, number];
  bedrooms?: number[];
  bathrooms?: number[];
  amenities?: string[];
  distance?: number;
  // Additional filters
  premiumOnly?: boolean;
  verified?: boolean;
  petFriendly?: boolean;
  furnished?: boolean;
  lifestyleTags?: string[];
  dietaryPreferences?: string[];
  // Services/worker filter
  showHireServices?: boolean;
  // Owner client filters
  clientGender?: 'male' | 'female' | 'other' | 'any' | 'all';
  clientType?: 'individual' | 'family' | 'business' | 'hire' | 'rent' | 'buy' | 'all';
}

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
    staleTime: 10 * 60 * 1000, // 10 minutes - listings are stable
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    // PERF: Keep previous data while fetching new data to prevent UI flash
    placeholderData: (prev) => prev,
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
        // SCHEMA: target_id = listing ID, target_type = 'listing', direction = 'right'
        const { data: likedListings, error: likesError } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', userId)
          .eq('target_type', 'listing')
          .eq('direction', 'right');

        const likedIds = new Set(!likesError ? (likedListings?.map(like => like.target_id) || []) : []);

        // Fetch left swipes with timestamps for 3-day expiry logic
        // After 3 days, dislikes become permanent and won't show even on refresh
        // Uses likes table with direction='left'
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

        const { data: leftSwipes } = await supabase
          .from('likes')
          .select('target_id, created_at')
          .eq('user_id', userId)
          .eq('target_type', 'listing')
          .eq('direction', 'left');

        // Build sets for dislike handling:
        // - permanentlyHiddenIds: dislikes older than 3 days (NEVER show again)
        // - refreshableDislikeIds: dislikes within 3 days (show only on refresh)
        const permanentlyHiddenIds = new Set<string>();
        const refreshableDislikeIds = new Set<string>();

        if (leftSwipes) {
          for (const swipe of leftSwipes) {
            const swipeDate = new Date(swipe.created_at);
            const threeDaysAgoDate = new Date(threeDaysAgo);

            if (swipeDate < threeDaysAgoDate) {
              // Dislike is older than 3 days - permanently hidden
              permanentlyHiddenIds.add(swipe.target_id);
            } else {
              // Dislike is within 3 days - can be refreshed
              refreshableDislikeIds.add(swipe.target_id);
            }
          }
        }

        // Build set of IDs to exclude based on mode
        const swipedListingIds = new Set<string>();

        // ALWAYS exclude liked items - they are saved permanently, never show again
        for (const id of likedIds) {
          swipedListingIds.add(id);
        }

        // ALWAYS exclude permanently hidden items (dislikes > 3 days old)
        for (const id of permanentlyHiddenIds) {
          swipedListingIds.add(id);
        }

        // In normal mode (not refresh), also exclude refreshable dislikes
        // In refresh mode, refreshable dislikes can be shown again
        if (!isRefreshMode) {
          for (const id of refreshableDislikeIds) {
            swipedListingIds.add(id);
          }
        }

        // Build query with filters and subscription data for premium prioritization
        // PERF: Select only fields needed for swipe cards (reduces payload ~50%)
        // This dramatically speeds up dashboard re-entry from camera/other routes
        const SWIPE_CARD_FIELDS = `
          id,
          title,
          price,
          images,
          city,
          neighborhood,
          beds,
          baths,
          square_footage,
          category,
          listing_type,
          property_type,
          vehicle_brand,
          vehicle_model,
          year,
          mileage,
          amenities,
          pet_friendly,
          furnished,
          has_verified_documents,
          owner_id,
          created_at
        `;

        let query = (supabase as any)
          .from('listings')
          .select(SWIPE_CARD_FIELDS)
          .eq('status', 'active')
          .neq('owner_id', userId); // CRITICAL: Exclude own listings

        // CRITICAL FIX: Exclude swiped listings at SQL level (not JavaScript)
        // This ensures pagination works correctly - without this, page 2 might return
        // the same items as page 1 if they were filtered out in JS
        if (swipedListingIds.size > 0) {
          const idsToExclude = Array.from(swipedListingIds);
          // Supabase supports NOT IN with array format
          query = query.not('id', 'in', `(${idsToExclude.map(id => `"${id}"`).join(',')})`);
        }

        query = query.order('created_at', { ascending: false }); // Newest first

        // Apply filter-based query constraints
        if (filters) {
          logger.info('[SmartMatching] Applying filters:', {
            categories: filters.categories,
            category: filters.category,
            listingType: filters.listingType,
          });

          // Category filter - support multiple categories
          // Apply normalizeCategoryName to convert 'services' -> 'worker' for database
          if (filters.categories && filters.categories.length > 0) {
            logger.info('[SmartMatching] Filtering by categories:', filters.categories);
            const dbCategories = filters.categories.map(c => normalizeCategoryName(c)).filter((c): c is string => c !== undefined);
            query = query.in('category', dbCategories);
          } else if (filters.category) {
            logger.info('[SmartMatching] Filtering by single category:', filters.category);
            const dbCategory = normalizeCategoryName(filters.category);
            if (dbCategory) {
              query = query.eq('category', dbCategory);
            }
          }

          // Listing type filter
          if (filters.listingType && filters.listingType !== 'both') {
            logger.info('[SmartMatching] Filtering by listing type:', filters.listingType);
            query = query.eq('listing_type', filters.listingType);
          }

          // Price range filter
          if (filters.priceRange) {
            query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
          }

          // Property type filter (for properties)
          if (filters.propertyType && filters.propertyType.length > 0) {
            query = query.in('property_type', filters.propertyType);
          }

          // Bedrooms filter
          if (filters.bedrooms && filters.bedrooms.length > 0) {
            const minBeds = Math.min(...filters.bedrooms);
            query = query.gte('beds', minBeds);
          }

          // Bathrooms filter
          if (filters.bathrooms && filters.bathrooms.length > 0) {
            const minBaths = Math.min(...filters.bathrooms);
            query = query.gte('baths', minBaths);
          }

          // Pet friendly filter - column may not exist
          // if (filters.petFriendly) {
          //   query = query.eq('pet_friendly', true);
          // }

          // Furnished filter - column may not exist
          // if (filters.furnished) {
          //   query = query.eq('furnished', true);
          // }

          // Verified filter - column may not exist
          // if (filters.verified) {
          //   query = query.eq('has_verified_documents', true);
          // }

          // Premium only filter (owner has premium subscription)
          // This will be applied client-side after we get subscription data
        }

        // Apply pagination
        const start = page * pageSize;
        const end = start + pageSize - 1;
        const { data: listings, error } = await query.range(start, end);

        logger.info('[SmartMatching] Query result:', {
          count: listings?.length || 0,
          error: error?.message,
          page,
          filters: filters ? {
            categories: filters.categories,
            listingType: filters.listingType,
          } : null,
        });

        if (error) {
          // Log ALL errors for debugging (including RLS)
          logger.error('[SmartMatching] Error fetching listings:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            filters: {
              category: filters?.category,
              categories: filters?.categories,
              listingType: filters?.listingType,
            }
          });
          // CRITICAL FIX: Don't throw error when paginating beyond available results
          // When there are no more results (e.g., fetching page 2 when only page 1 exists),
          // Supabase returns an empty array, not an error. But if it does error,
          // return empty array instead of throwing to show "All Caught Up" screen
          return [];
        }

        if (!listings?.length) {
          return [];
        }

        // Apply client-side filters for amenities (can't be done in SQL easily with JSONB)
        let filteredListings = listings as unknown as Listing[];
        if (filters?.amenities && filters.amenities.length > 0) {
          filteredListings = filteredListings.filter(listing => {
            const listingAmenities = listing.amenities || [];
            return filters.amenities!.some(amenity => listingAmenities.includes(amenity));
          });
        }

        // Premium only filter - disabled since we removed the join
        // This can be re-enabled with a separate query if needed
        if (filters?.premiumOnly) {
          // Skip premium filtering for now - all listings shown
        }

        // DEFENSE IN DEPTH: Double-check that user never sees their own listings
        // The SQL query already excludes these, but this catches any edge cases
        // NOTE: Swiped listings are now excluded at SQL level (see query above)
        filteredListings = filteredListings.filter(listing => {
          if (listing.owner_id === userId) {
            logger.warn('[SmartMatching] CRITICAL: Own listing leaked through DB query, filtering it out:', listing.id);
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
          const match = calculateListingMatch(preferences, listing as Listing);

          return {
            ...listing as Listing,
            matchPercentage: match.percentage,
            matchReasons: match.reasons,
            incompatibleReasons: match.incompatible,
            _premiumTier: 'free', // Default since we removed premium join
            _visibilityBoost: 0
          };
        });

        // Sort by premium tier first, then match percentage
        const sortedListings = matchedListings
          .filter(listing => listing.matchPercentage >= 0)
          .sort((a, b) => {
            // Premium tiers get priority
            const tierOrder: Record<string, number> = {
              unlimited: 1,
              premium_plus: 2,
              premium: 3,
              basic: 4,
              free: 5
            };

            const tierA = tierOrder[(a as any)._premiumTier] || 5;
            const tierB = tierOrder[(b as any)._premiumTier] || 5;

            // If different tiers, prioritize better tier
            if (tierA !== tierB) {
              return tierA - tierB;
            }

            // Same tier: sort by match percentage
            return b.matchPercentage - a.matchPercentage;
          });

        // Sort by newest first within each premium tier to show fresh listings first
        // Group by premium tier and sort by date within each tier
        const tierGroups: Record<string, MatchedListing[]> = {
          unlimited: [],
          premium_plus: [],
          premium: [],
          basic: [],
          free: []
        };

        sortedListings.forEach(listing => {
          const tier = (listing as any)._premiumTier || 'free';
          if (!tierGroups[tier]) tierGroups[tier] = [];
          tierGroups[tier].push(listing);
        });

        // Sort each tier by created_at (newest first) instead of shuffling
        const sortByDate = (a: MatchedListing, b: MatchedListing) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Descending (newest first)
        };

        const randomizedListings = [
          ...tierGroups.unlimited.sort(sortByDate),
          ...tierGroups.premium_plus.sort(sortByDate),
          ...tierGroups.premium.sort(sortByDate),
          ...tierGroups.basic.sort(sortByDate),
          ...tierGroups.free.sort(sortByDate)
        ];

        // Fallback: if no matches found but we have listings, show them all with default score
        if (randomizedListings.length === 0 && filteredListings.length > 0) {
          const fallbackListings = filteredListings.map(listing => ({
            ...listing as Listing,
            matchPercentage: 20,
            matchReasons: ['General listing'],
            incompatibleReasons: []
          }));
          logger.info('[SmartMatching] Returning fallback listings:', {
            totalReturned: fallbackListings.length,
            userId: userId
          });
          return shuffleArray(fallbackListings);
        }

        logger.info('[SmartMatching] Returning listings:', {
          totalReturned: randomizedListings.length,
          userId: userId,
          page: page,
          listingIds: randomizedListings.map(l => l.id).slice(0, 5) // Log first 5 IDs for debugging
        });

        // Verify none of the returned listings are the user's own
        const hasOwnListing = randomizedListings.some(l => l.owner_id === userId);
        if (hasOwnListing) {
          logger.error('[SmartMatching] CRITICAL BUG: User\'s own listing in results!', {
            userId: userId,
            listings: randomizedListings.filter(l => l.owner_id === userId).map(l => l.id)
          });
          // Filter it out as last resort
          const cleanedListings = randomizedListings.filter(l => l.owner_id !== userId);
          return cleanedListings;
        }

        return randomizedListings;
      } catch (error) {
        logger.error('Error in smart listing matching:', error);
        // Return empty array only if there's no previous data
        // The placeholderData option will preserve previous results
        return [];
      }
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  });
}

// Calculate match between owner preferences and client profile
function calculateClientMatch(ownerPrefs: any, clientProfile: any): {
  percentage: number;
  reasons: string[];
  incompatible: string[];
} {
  const criteria = [];
  const matchedReasons = [];
  const incompatibleReasons = [];

  // Budget compatibility
  if (ownerPrefs.min_budget || ownerPrefs.max_budget) {
    const budgetMax = clientProfile.budget_max ? Number(clientProfile.budget_max) : null;
    const monthlyIncome = clientProfile.monthly_income ? Number(clientProfile.monthly_income) : null;
    const clientBudget = budgetMax || monthlyIncome;

    if (clientBudget) {
      const budgetInRange = (!ownerPrefs.min_budget || clientBudget >= ownerPrefs.min_budget) &&
                           (!ownerPrefs.max_budget || clientBudget <= ownerPrefs.max_budget);
      criteria.push({
        weight: 20,
        matches: budgetInRange,
        reason: `Budget $${clientBudget} in range`,
        incompatibleReason: `Budget $${clientBudget} outside range`
      });
    }
  }

  // Gender matching
  if (ownerPrefs.selected_genders?.length && !ownerPrefs.selected_genders.includes('Any Gender')) {
    const genderMatch = clientProfile.gender && ownerPrefs.selected_genders.includes(clientProfile.gender);
    criteria.push({
      weight: 10,
      matches: genderMatch,
      reason: `Gender ${clientProfile.gender} matches preferences`,
      incompatibleReason: `Gender ${clientProfile.gender} not in preferred list`
    });
  }

  // Nationality matching
  if (ownerPrefs.selected_nationalities?.length && !ownerPrefs.selected_nationalities.includes('Any Nationality')) {
    const nationalityMatch = clientProfile.nationality && ownerPrefs.selected_nationalities.includes(clientProfile.nationality);
    criteria.push({
      weight: 8,
      matches: nationalityMatch,
      reason: `Nationality ${clientProfile.nationality} matches`,
      incompatibleReason: `Nationality ${clientProfile.nationality} not preferred`
    });
  }

  // Languages matching - client speaks at least one preferred language
  if (ownerPrefs.selected_languages?.length && clientProfile.languages?.length) {
    const sharedLanguages = clientProfile.languages.filter((lang: string) =>
      ownerPrefs.selected_languages.includes(lang)
    );
    const hasLanguageMatch = sharedLanguages.length > 0;
    criteria.push({
      weight: 5,
      matches: hasLanguageMatch,
      reason: `Speaks ${sharedLanguages.join(', ')}`,
      incompatibleReason: 'No shared languages'
    });
  }

  // Relationship status matching
  if (ownerPrefs.selected_relationship_status?.length && !ownerPrefs.selected_relationship_status.includes('Any Status')) {
    const statusMatch = clientProfile.relationship_status &&
                       ownerPrefs.selected_relationship_status.includes(clientProfile.relationship_status);
    criteria.push({
      weight: 10,
      matches: statusMatch,
      reason: `${clientProfile.relationship_status} matches preference`,
      incompatibleReason: `${clientProfile.relationship_status} not preferred`
    });
  }

  // Children compatibility
  if (ownerPrefs.allows_children !== undefined && ownerPrefs.allows_children !== null) {
    const childrenMatch = !clientProfile.has_children || ownerPrefs.allows_children;
    criteria.push({
      weight: 12,
      matches: childrenMatch,
      reason: ownerPrefs.allows_children ? 'Children welcome' : 'No children, no restrictions',
      incompatibleReason: 'Has children but not allowed'
    });
  }

  // Smoking habit matching
  if (ownerPrefs.smoking_habit && ownerPrefs.smoking_habit !== 'Any') {
    const smokingMatch = !clientProfile.smoking_habit ||
                        clientProfile.smoking_habit === 'Non-Smoker' ||
                        ownerPrefs.smoking_habit === clientProfile.smoking_habit;
    criteria.push({
      weight: 15,
      matches: smokingMatch,
      reason: `Smoking: ${clientProfile.smoking_habit || 'Non-Smoker'}`,
      incompatibleReason: `Smoking habits incompatible`
    });
  }

  // Drinking habit matching
  if (ownerPrefs.drinking_habit && ownerPrefs.drinking_habit !== 'Any') {
    const drinkingMatch = !clientProfile.drinking_habit ||
                         clientProfile.drinking_habit === 'Non-Drinker' ||
                         ownerPrefs.drinking_habit === clientProfile.drinking_habit;
    criteria.push({
      weight: 10,
      matches: drinkingMatch,
      reason: `Drinking: ${clientProfile.drinking_habit || 'Non-Drinker'}`,
      incompatibleReason: `Drinking habits incompatible`
    });
  }

  // Cleanliness level matching
  if (ownerPrefs.cleanliness_level && ownerPrefs.cleanliness_level !== 'Any') {
    const cleanlinessMatch = !clientProfile.cleanliness_level ||
                            ownerPrefs.cleanliness_level === clientProfile.cleanliness_level;
    criteria.push({
      weight: 12,
      matches: cleanlinessMatch,
      reason: `Cleanliness: ${clientProfile.cleanliness_level || 'Standard'}`,
      incompatibleReason: `Cleanliness standards don't match`
    });
  }

  // Noise tolerance matching
  if (ownerPrefs.noise_tolerance && ownerPrefs.noise_tolerance !== 'Any') {
    const noiseMatch = !clientProfile.noise_tolerance ||
                      ownerPrefs.noise_tolerance === clientProfile.noise_tolerance;
    criteria.push({
      weight: 8,
      matches: noiseMatch,
      reason: `Noise tolerance compatible`,
      incompatibleReason: `Noise tolerance incompatible`
    });
  }

  // Work schedule matching
  if (ownerPrefs.work_schedule && ownerPrefs.work_schedule !== 'Any') {
    const scheduleMatch = !clientProfile.work_schedule ||
                         ownerPrefs.work_schedule === clientProfile.work_schedule;
    criteria.push({
      weight: 10,
      matches: scheduleMatch,
      reason: `Work schedule: ${clientProfile.work_schedule || 'Flexible'}`,
      incompatibleReason: `Work schedules incompatible`
    });
  }

  // Dietary preferences matching
  if (ownerPrefs.selected_dietary_preferences?.length && clientProfile.dietary_preferences?.length) {
    const sharedDiets = clientProfile.dietary_preferences.filter((diet: string) =>
      ownerPrefs.selected_dietary_preferences.includes(diet)
    );
    const hasDietMatch = sharedDiets.length > 0;
    criteria.push({
      weight: 5,
      matches: hasDietMatch,
      reason: `Shared diets: ${sharedDiets.join(', ')}`,
      incompatibleReason: 'No dietary compatibility'
    });
  }

  // Personality traits matching
  if (ownerPrefs.selected_personality_traits?.length && clientProfile.personality_traits?.length) {
    const sharedTraits = clientProfile.personality_traits.filter((trait: string) =>
      ownerPrefs.selected_personality_traits.includes(trait)
    );
    const matchRate = sharedTraits.length / ownerPrefs.selected_personality_traits.length;
    criteria.push({
      weight: 8,
      matches: matchRate >= 0.3, // At least 30% trait overlap
      reason: `${sharedTraits.length} shared personality traits`,
      incompatibleReason: 'Personality traits don\'t align'
    });
  }

  // Interests matching
  if (ownerPrefs.selected_interests?.length && clientProfile.interest_categories?.length) {
    const sharedInterests = clientProfile.interest_categories.filter((interest: string) =>
      ownerPrefs.selected_interests.includes(interest)
    );
    const matchRate = sharedInterests.length / ownerPrefs.selected_interests.length;
    criteria.push({
      weight: 10,
      matches: matchRate >= 0.2, // At least 20% interest overlap
      reason: `${sharedInterests.length} shared interests`,
      incompatibleReason: 'Few shared interests'
    });
  }

  // Age range matching
  if (ownerPrefs.min_age && ownerPrefs.max_age && clientProfile.age) {
    const ageInRange = clientProfile.age >= ownerPrefs.min_age &&
                      clientProfile.age <= ownerPrefs.max_age;
    criteria.push({
      weight: 10,
      matches: ageInRange,
      reason: `Age ${clientProfile.age} in range (${ownerPrefs.min_age}-${ownerPrefs.max_age})`,
      incompatibleReason: `Age ${clientProfile.age} outside range`
    });
  }

  // Pet compatibility
  if (ownerPrefs.allows_pets !== undefined && ownerPrefs.allows_pets !== null) {
    const petMatch = !clientProfile.has_pets || ownerPrefs.allows_pets;
    criteria.push({
      weight: 12,
      matches: petMatch,
      reason: ownerPrefs.allows_pets ? 'Pets allowed' : 'No pets, no issue',
      incompatibleReason: 'Has pets but not allowed'
    });
  }

  // Lifestyle compatibility
  if (ownerPrefs.compatible_lifestyle_tags?.length && clientProfile.lifestyle_tags?.length) {
    const matchingLifestyle = clientProfile.lifestyle_tags.filter((tag: string) =>
      ownerPrefs.compatible_lifestyle_tags.includes(tag)
    );
    const matchRate = matchingLifestyle.length / ownerPrefs.compatible_lifestyle_tags.length;
    criteria.push({
      weight: 15,
      matches: matchRate >= 0.3,
      reason: `${matchingLifestyle.length} shared lifestyle interests`,
      incompatibleReason: 'Limited lifestyle compatibility'
    });
  }

  // Verification status boost
  if (clientProfile.verified || clientProfile.income_verification) {
    criteria.push({
      weight: 10,
      matches: true,
      reason: 'Verified profile',
      incompatibleReason: ''
    });
  }

  // Calculate weighted percentage
  let totalWeight = 0;
  let matchedWeight = 0;

  criteria.forEach(criterion => {
    totalWeight += criterion.weight;
    if (criterion.matches) {
      matchedWeight += criterion.weight;
      if (criterion.reason) matchedReasons.push(criterion.reason);
    } else {
      if (criterion.incompatibleReason) incompatibleReasons.push(criterion.incompatibleReason);
    }
  });

  const percentage = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 70;

  return {
    percentage,
    reasons: matchedReasons,
    incompatible: incompatibleReasons
  };
}

export function useSmartClientMatching(
  userId?: string, // PERF: Accept userId to avoid getUser() inside queryFn
  category?: 'property' | 'moto' | 'bicycle',
  page: number = 0,
  pageSize: number = 10,
  isRefreshMode: boolean = false, // When true, show disliked profiles within cooldown
  filters?: ClientFilters
) {
  // Serialize filters to string for stable query key (prevents cache misses from object reference changes)
  const filtersKey = filters ? JSON.stringify(filters) : '';

  return useQuery<MatchedClientProfile[]>({
    queryKey: ['smart-clients', userId, category, page, isRefreshMode, filtersKey],
    // PERF: Longer stale time for client profiles since they don't change frequently
    staleTime: 10 * 60 * 1000, // 10 minutes - profiles are stable
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    // PERF: Keep previous data while fetching new data to prevent UI flash
    placeholderData: (prev) => prev,
    queryFn: async () => {
      // PERF: userId is passed in, no need for async getUser() call
      if (!userId) {
        logger.warn('[SmartMatching] No userId provided, returning empty profiles');
        return [] as MatchedClientProfile[];
      }

      // CRITICAL: Defensive check - ensure userId is a valid UUID
      if (typeof userId !== 'string' || userId.trim() === '') {
        logger.error('[SmartMatching] Invalid userId:', userId);
        return [] as MatchedClientProfile[];
      }

      try {
        logger.info('[SmartMatching] Fetching client profiles for owner:', userId);

        // For owners, fetch liked clients from likes table (target_type='profile')
        const { data: ownerLikedClients, error: ownerLikesError } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', userId)
          .eq('target_type', 'profile')
          .eq('direction', 'right');

        const likedIds = new Set<string>();
        if (!ownerLikesError && ownerLikedClients) {
          for (const row of ownerLikedClients) {
            if (row.target_id) {
              likedIds.add(row.target_id);
            }
          }
        }

        // Fetch left swipes with timestamps for 3-day expiry logic
        // After 3 days, dislikes become permanent and won't show even on refresh
        // Uses likes table with direction='left'
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

        const { data: leftSwipes } = await supabase
          .from('likes')
          .select('target_id, created_at')
          .eq('user_id', userId)
          .eq('target_type', 'profile')
          .eq('direction', 'left');

        // Build sets for dislike handling:
        // - permanentlyHiddenIds: dislikes older than 3 days (NEVER show again)
        // - refreshableDislikeIds: dislikes within 3 days (show only on refresh)
        const permanentlyHiddenIds = new Set<string>();
        const refreshableDislikeIds = new Set<string>();

        if (leftSwipes) {
          for (const swipe of leftSwipes) {
            const swipeDate = new Date(swipe.created_at);
            const threeDaysAgoDate = new Date(threeDaysAgo);

            if (swipeDate < threeDaysAgoDate) {
              // Dislike is older than 3 days - permanently hidden
              permanentlyHiddenIds.add(swipe.target_id);
            } else {
              // Dislike is within 3 days - can be refreshed
              refreshableDislikeIds.add(swipe.target_id);
            }
          }
        }

        // Build set of IDs to exclude based on mode
        const swipedProfileIds = new Set<string>();

        // ALWAYS exclude liked profiles - they are saved permanently, never show again
        for (const id of likedIds) {
          swipedProfileIds.add(id);
        }

        // ALWAYS exclude permanently hidden profiles (dislikes > 3 days old)
        for (const id of permanentlyHiddenIds) {
          swipedProfileIds.add(id);
        }

        // In normal mode (not refresh), also exclude refreshable dislikes
        // In refresh mode, refreshable dislikes can be shown again
        if (!isRefreshMode) {
          for (const id of refreshableDislikeIds) {
            swipedProfileIds.add(id);
          }
        }

        // CRITICAL: Only show CLIENT profiles to owners, exclude admins and other owners
        // PERF: Select only fields needed for owner's client swipe cards (reduces payload ~50%)
        // FIXED: Removed non-existent columns (property_types, moto_types, bicycle_types)
        const CLIENT_SWIPE_CARD_FIELDS = `
          id,
          full_name,
          age,
          gender,
          city,
          country,
          images,
          avatar_url,
          verified,
          budget_min,
          budget_max,
          interests,
          lifestyle_tags,
          has_pets,
          smoking,
          party_friendly,
          work_schedule,
          nationality,
          languages_spoken,
          neighborhood,
          user_roles!inner(role)
        `;

        // Build the query with SQL-level exclusions
        let profileQuery = supabase
          .from('profiles')
          .select(CLIENT_SWIPE_CARD_FIELDS)
          .neq('id', userId) // CRITICAL: Never show user their own profile
          .eq('user_roles.role', 'client')
          .or('is_active.is.null,is_active.eq.true'); // Only show active profiles (null or true)

        // CRITICAL FIX: Exclude swiped profiles at SQL level (not JavaScript)
        // This ensures pagination works correctly
        if (swipedProfileIds.size > 0) {
          const idsToExclude = Array.from(swipedProfileIds);
          profileQuery = profileQuery.not('id', 'in', `(${idsToExclude.map(id => `"${id}"`).join(',')})`);
        }

        const start = page * pageSize;
        const end = start + pageSize - 1;
        const { data: profiles, error: profileError } = await profileQuery.range(start, end);

        if (profileError) {
          // CRITICAL FIX: Don't throw error when paginating beyond available results
          // Return empty array to show "All Caught Up" screen instead of error
          logger.error('[SmartMatching] Error fetching client profiles:', profileError.message);
          return [] as MatchedClientProfile[];
        }

        if (!profiles?.length) {
          logger.info('[SmartMatching] No client profiles found for page:', page);
          return [] as MatchedClientProfile[];
        }

        logger.info('[SmartMatching] Fetched profiles before filtering:', profiles.length);

        // Map profiles with placeholder images
        // NOTE: Swiped profiles are now excluded at SQL level (see query above)
        // CRITICAL: Also filter out profiles with mock/fake images (unsplash, placeholder URLs, etc.)
        let filteredProfiles = (profiles as any[])
          .filter(profile => {
            // DEFENSE IN DEPTH: Double-check - never show user their own profile
            if (profile.id === userId) {
              logger.warn('[SmartMatching] CRITICAL: Own profile leaked through DB query, filtering it out:', profile.id);
              return false;
            }
            return true;
          })
          .filter(profile => !hasMockImages(profile.images)) // Remove profiles with fake/mock photos
          .map(profile => ({
            ...profile,
            images: profile.images && profile.images.length > 0
              ? profile.images
              : ['/placeholder-avatar.svg']
          }));

        // Apply client filters if provided
        if (filters) {
          logger.info('[SmartClientMatching] Applying client filters:', {
            clientGender: (filters as any).clientGender,
            clientType: (filters as any).clientType,
            categories: (filters as any).categories,
          });
          filteredProfiles = filteredProfiles.filter(profile => {
            // Budget range filter
            // FIX: Add array length check before accessing indices
            if (filters.budgetRange && Array.isArray(filters.budgetRange) && filters.budgetRange.length === 2) {
              const clientBudget = profile.budget_max || profile.monthly_income || 0;
              if (clientBudget < filters.budgetRange[0] || clientBudget > filters.budgetRange[1]) {
                return false;
              }
            }

            // Age range filter
            // FIX: Add array length check before accessing indices
            if (filters.ageRange && Array.isArray(filters.ageRange) && filters.ageRange.length === 2 && profile.age) {
              if (profile.age < filters.ageRange[0] || profile.age > filters.ageRange[1]) {
                return false;
              }
            }

            // Gender filter (from quick filters or advanced filters)
            if (filters.genders && filters.genders.length > 0 && profile.gender) {
              if (!filters.genders.includes(profile.gender.toLowerCase())) {
                return false;
              }
            }

            // Quick filter: clientGender (map to genders filter)
            if ((filters as any).clientGender && (filters as any).clientGender !== 'any' && profile.gender) {
              if (profile.gender.toLowerCase() !== (filters as any).clientGender.toLowerCase()) {
                return false;
              }
            }

            // Quick filter: clientType (what the client is looking for: hire/rent/buy)
            if ((filters as any).clientType && (filters as any).clientType !== 'all' && profile.preferred_listing_type) {
              const clientType = (filters as any).clientType;
              // Map clientType to listing type: 'hire' -> 'hire', 'rent' -> 'rent', 'buy' -> 'sale'
              const lookingFor = clientType === 'buy' ? 'sale' : clientType;
              if (profile.preferred_listing_type !== lookingFor) {
                return false;
              }
            }

            // Quick filter: categories (what type of listings the client is interested in)
            // This filters clients who are looking for specific categories (property, moto, etc.)
            if ((filters as any).categories && (filters as any).categories.length > 0) {
              const categories = (filters as any).categories;
              let hasMatchingCategory = false;

              // Check if client has preferences for any of the selected categories
              // FIXED: Use preferred_property_types instead of non-existent columns
              for (const category of categories) {
                if (category === 'property' && profile.preferred_property_types && profile.preferred_property_types.length > 0) {
                  hasMatchingCategory = true;
                  break;
                }
                // For motorcycle/bicycle, check preferred_listing_type or interests
                if (category === 'motorcycle' && profile.preferred_listing_type?.includes('moto')) {
                  hasMatchingCategory = true;
                  break;
                }
                if (category === 'bicycle' && profile.preferred_listing_type?.includes('bicycle')) {
                  hasMatchingCategory = true;
                  break;
                }
                // Services category - for now, show all clients as they might be interested in services
                if (category === 'services') {
                  hasMatchingCategory = true;
                  break;
                }
              }

              if (!hasMatchingCategory) {
                return false;
              }
            }

            // Pet friendly filter
            if (filters.hasPets !== undefined && profile.has_pets !== undefined) {
              if (filters.hasPets !== profile.has_pets) {
                return false;
              }
            }

            // Smoking filter
            if (filters.smoking !== undefined && profile.smoking !== undefined) {
              if (filters.smoking !== profile.smoking) {
                return false;
              }
            }

            // Party friendly filter
            if (filters.partyFriendly !== undefined && profile.party_friendly !== undefined) {
              if (filters.partyFriendly !== profile.party_friendly) {
                return false;
              }
            }

            // Verified filter
            if (filters.verified && !profile.verified) {
              return false;
            }

            // Nationalities filter
            if (filters.nationalities && filters.nationalities.length > 0 && profile.nationality) {
              if (!filters.nationalities.includes(profile.nationality)) {
                return false;
              }
            }

            // Languages filter (client must speak at least one of the required languages)
            if (filters.languages && filters.languages.length > 0 && profile.languages) {
              const hasMatchingLanguage = filters.languages.some(lang =>
                profile.languages.includes(lang)
              );
              if (!hasMatchingLanguage) {
                return false;
              }
            }

            // Relationship status filter
            if (filters.relationshipStatus && filters.relationshipStatus.length > 0 && profile.relationship_status) {
              if (!filters.relationshipStatus.includes(profile.relationship_status)) {
                return false;
              }
            }

            // Interests filter (client must have at least one matching interest)
            if (filters.interests && filters.interests.length > 0 && profile.interests) {
              const hasMatchingInterest = filters.interests.some(interest =>
                profile.interests.includes(interest)
              );
              if (!hasMatchingInterest) {
                return false;
              }
            }

            // Lifestyle tags filter (client must have at least one matching tag)
            if (filters.lifestyleTags && filters.lifestyleTags.length > 0 && profile.lifestyle_tags) {
              const hasMatchingTag = filters.lifestyleTags.some(tag =>
                profile.lifestyle_tags.includes(tag)
              );
              if (!hasMatchingTag) {
                return false;
              }
            }

            return true;
          });
        }

        // Calculate match scores based on profile completeness and preferences
        const matchedClients: MatchedClientProfile[] = filteredProfiles.map(profile => {
          const matchReasons: string[] = [];
          let baseScore = 50; // Start with base score

          // Add points for profile completeness
          if (profile.full_name) baseScore += 5;
          if (profile.age) baseScore += 5;
          if (profile.city) baseScore += 5;
          if (profile.interests?.length > 0) baseScore += 10;
          if (profile.verified) baseScore += 15;
          if (profile.images?.length > 0) baseScore += 10;

          // Build match reasons
          if (profile.verified) matchReasons.push('Verified profile');
          if (profile.interests?.length > 0) matchReasons.push(`${profile.interests.length} interests`);
          if (profile.city) matchReasons.push(`Located in ${profile.city}`);

          const match = {
            percentage: Math.min(100, baseScore),
            reasons: matchReasons.length > 0 ? matchReasons : ['Profile available'],
            incompatible: [] as string[]
          };

          return {
            id: profile.id, // Use stable user ID instead of random number
            user_id: profile.id,
            name: profile.full_name || 'Anonymous',
            age: profile.age || 0,
            gender: profile.gender || '',
            interests: profile.interests || [],
            preferred_activities: [],
            location: profile.city ? { city: profile.city } : {},
            lifestyle_tags: profile.lifestyle_tags || [],
            profile_images: profile.images || [],
            preferred_listing_types: [],
            budget_min: profile.budget_min || 0,
            budget_max: profile.budget_max || 100000,
            matchPercentage: match.percentage,
            matchReasons: match.reasons,
            incompatibleReasons: match.incompatible,
            city: profile.city || undefined,
            country: profile.country || undefined,
            avatar_url: profile.avatar_url || undefined,
            verified: profile.verified || false,
            work_schedule: profile.work_schedule || undefined,
            nationality: profile.nationality || undefined,
            languages: profile.languages_spoken || undefined,
            neighborhood: profile.neighborhood || undefined,
          } as MatchedClientProfile;
        });

        // Sort by match percentage
        const sortedClients = matchedClients.sort((a, b) => b.matchPercentage - a.matchPercentage);

        logger.info('[SmartMatching] Returning client profiles:', {
          totalReturned: sortedClients.length,
          userId: userId,
          page: page,
          profileIds: sortedClients.map(p => p.id).slice(0, 5) // Log first 5 IDs for debugging
        });

        // Verify none of the returned profiles are the user's own profile
        // Note: p.id is numeric (table PK), p.user_id is the UUID we compare against
        const hasOwnProfile = sortedClients.some(p => p.user_id === userId);
        if (hasOwnProfile) {
          logger.error('[SmartMatching] CRITICAL BUG: User\'s own profile in results!', {
            userId: userId,
            profiles: sortedClients.filter(p => p.user_id === userId)
          });
          // Filter it out as last resort
          const cleanedClients = sortedClients.filter(p => p.user_id !== userId);
          return cleanedClients;
        }

        // Sort by match percentage only - no random shuffle during normal loads
        // Shuffling causes visual instability when returning to dashboard
        // Order is stable within a session, provides predictable UX
        return sortedClients;
      } catch (error) {
        logger.error('[useSmartClientMatching] Error loading client profiles', error);
        // Return empty array only if there's no previous data
        // The placeholderData option will preserve previous results
        return [] as MatchedClientProfile[];
      }
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  });
}