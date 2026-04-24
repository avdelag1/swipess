import { Listing } from '../useListings';
import { ClientFilterPreferences } from '../useClientFilterPreferences';

/**
 * Calculate match percentage between client preferences and a listing.
 * Returns a weighted score based on price, location, property type, amenities, etc.
 */
export function calculateListingMatch(preferences: ClientFilterPreferences, listing: Listing): {
    percentage: number;
    reasons: string[];
    incompatible: string[];
} {
    const criteria: Array<{ weight: number; matches: boolean; reason: string; incompatibleReason: string }> = [];
    const matchedReasons: string[] = [];
    const incompatibleReasons: string[] = [];

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

    // Category and Intention alignment (Implicit connection)
    // If listing is property and client is interested in properties
    const isCategoryMatch =
        (listing.category === 'property' && preferences.interested_in_properties) ||
        (listing.category === 'motorcycle' && preferences.interested_in_motorcycles) ||
        (listing.category === 'bicycle' && preferences.interested_in_bicycles);

    if (isCategoryMatch) {
        matchedReasons.push(`Matches your interest in ${listing.category}s`);
    }

    // Price range matching with 20% flexibility
    // Support both DB column names (price_min/price_max) and legacy aliases (min_price/max_price)
    // Support legacy DB column aliases (min_price/max_price) alongside current (price_min/price_max)
    type PrefsWithLegacy = typeof preferences & { min_price?: number; max_price?: number };
    const prefsLegacy = preferences as PrefsWithLegacy;
    const priceMin = preferences.price_min ?? prefsLegacy.min_price;
    const priceMax = preferences.price_max ?? prefsLegacy.max_price;
    if (priceMin && priceMax) {
        const priceFlexibility = 0.2;
        const adjustedMinPrice = priceMin * (1 - priceFlexibility);
        const adjustedMaxPrice = priceMax * (1 + priceFlexibility);
        const priceInRange = listing.price >= adjustedMinPrice && listing.price <= adjustedMaxPrice;
        criteria.push({
            weight: 25,
            matches: priceInRange,
            reason: `Price $${listing.price} within flexible budget`,
            incompatibleReason: `Price $${listing.price} outside flexible budget range`
        });
    }

    // Bedrooms matching for properties
    if ((listing.category === 'property' || listing.beds) && preferences.min_bedrooms && preferences.max_bedrooms) {
        criteria.push({
            weight: 15,
            matches: (listing.beds ?? 0) >= preferences.min_bedrooms && (listing.beds ?? 0) <= preferences.max_bedrooms,
            reason: `${listing.beds ?? 0} beds matches requirement (${preferences.min_bedrooms}-${preferences.max_bedrooms})`,
            incompatibleReason: `${listing.beds ?? 0} beds is outside your ${preferences.min_bedrooms}-${preferences.max_bedrooms} range`
        });
    }

    // Property type matching
    if ((listing.category === 'property' || listing.property_type) && preferences.property_types?.length && listing.property_type) {
        criteria.push({
            weight: 15,
            matches: preferences.property_types.includes(listing.property_type),
            reason: `Property type ${listing.property_type} matches preferences`,
            incompatibleReason: `${listing.property_type} isn't in your preferred types`
        });
    }

    // Vehicle specific matching
    if (listing.category === 'motorcycle' && preferences.moto_types?.length && listing.vehicle_brand) {
        criteria.push({
            weight: 20,
            matches: preferences.moto_types.includes(listing.vehicle_brand) || preferences.moto_types.includes(listing.property_type || ''),
            reason: `Matches your motorcycle style preference`,
            incompatibleReason: `Different from your preferred motorcycle types`
        });
    }

    // Pet friendly matching
    if (preferences.pet_friendly_required) {
        criteria.push({
            weight: 12,
            matches: !!listing.pet_friendly,
            reason: 'Pet-friendly property',
            incompatibleReason: 'Not pet-friendly (Requires pets)'
        });
    }

    // Amenities matching
    if (preferences.amenities_required?.length) {
        const listingAmenities = listing.amenities || [];
        const matchingAmenities = listingAmenities.filter(amenity =>
            preferences.amenities_required?.includes(amenity)
        );
        const amenityMatchRate = matchingAmenities.length / preferences.amenities_required.length;

        criteria.push({
            weight: 15,
            matches: amenityMatchRate >= 0.4,
            reason: `Has ${matchingAmenities.length}/${preferences.amenities_required.length} required amenities`,
            incompatibleReason: `Missing most required amenities`
        });
    }

    // Freshness signal: newer listings score higher (recency matters for UX)
    if ((listing as any).created_at) {
        const daysSincePosted = (Date.now() - new Date((listing as any).created_at).getTime()) / (1000 * 60 * 60 * 24);
        const freshnessScore = Math.max(0, 1 - daysSincePosted / 30); // 100% if today, 0% if 30+ days
        criteria.push({
            weight: 10,
            matches: freshnessScore > 0.5,
            reason: 'Recently posted',
            incompatibleReason: ''
        });
    }

    // Desirability signals (universal perks)
    if ((listing as any).furnished) {
        criteria.push({ weight: 5, matches: true, reason: 'Furnished', incompatibleReason: '' });
    }
    if ((listing as any).pet_friendly) {
        criteria.push({ weight: 5, matches: true, reason: 'Pet-friendly', incompatibleReason: '' });
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

    // If no criteria were set (user has no preferences), score based on category alignment
    // + recency signals rather than a meaningless flat number
    if (totalWeight === 0) {
        const isCategoryMatch =
            (listing.category === 'property' && (preferences as any).interested_in_properties) ||
            (listing.category === 'motorcycle' && (preferences as any).interested_in_motorcycles) ||
            (listing.category === 'bicycle' && (preferences as any).interested_in_bicycles);
        const base = isCategoryMatch ? 72 : 60;
        return { percentage: base, reasons: ['Matches your search area'], incompatible: [] };
    }

    const percentage = Math.round((matchedWeight / totalWeight) * 100);

    return {
        percentage,
        reasons: Array.from(new Set(matchedReasons)),
        incompatible: Array.from(new Set(incompatibleReasons))
    };
}

/**
 * Calculate match between owner preferences and a client profile.
 * Returns a weighted score based on budget, demographics, lifestyle, and alignment.
 */
export function calculateClientMatch(ownerPrefs: any, clientProfile: any): {
    percentage: number;
    reasons: string[];
    incompatible: string[];
} {
    const criteria: Array<{ weight: number; matches: boolean; reason: string; incompatibleReason: string }> = [];
    const matchedReasons: string[] = [];
    const incompatibleReasons: string[] = [];

    // 🎯 Intention vs Service Offering Alignment (The core connection)
    if (clientProfile.intentions?.length && ownerPrefs.service_offerings?.length) {
        const intentionToOfferingMap: Record<string, string[]> = {
            'rent_property': ['property_rental'],
            'buy_property': ['property_sale'],
            'rent_motorcycle': ['motorcycle_rental'],
            'buy_motorcycle': ['motorcycle_rental', 'professional_services'],
            'rent_bicycle': ['bicycle_rental'],
            'hire_service': ['professional_services'],
        };

        const matchingIntentions = clientProfile.intentions.filter((intention: string) => {
            const mappedOfferings = intentionToOfferingMap[intention] || [];
            return mappedOfferings.some(offering => ownerPrefs.service_offerings.includes(offering));
        });

        if (matchingIntentions.length > 0) {
            criteria.push({
                weight: 30,
                matches: true,
                reason: 'Intentions align perfectly with your offerings',
                incompatibleReason: ''
            });
        } else {
            criteria.push({
                weight: 30,
                matches: false,
                reason: '',
                incompatibleReason: 'Looking for different services than what you offer'
            });
        }
    }

    // Budget compatibility
    if (ownerPrefs.min_budget || ownerPrefs.max_budget) {
        const clientBudget = clientProfile.budget_max || clientProfile.monthly_income || 0;
        if (clientBudget !== 0) {
            const budgetInRange = (!ownerPrefs.min_budget || clientBudget >= ownerPrefs.min_budget) &&
                (!ownerPrefs.max_budget || clientBudget <= ownerPrefs.max_budget);
            criteria.push({
                weight: 20,
                matches: budgetInRange,
                reason: `Budget $${clientBudget} in range`,
                incompatibleReason: `Budget ($${clientBudget}) is outside your filter`
            });
        }
    }

    // Lifestyle compatibility (Standardized tags)
    if (ownerPrefs.compatible_lifestyle_tags?.length && clientProfile.lifestyle_tags?.length) {
        const sharedLifestyle = clientProfile.lifestyle_tags.filter((tag: string) =>
            ownerPrefs.compatible_lifestyle_tags.includes(tag)
        );
        const matchRate = sharedLifestyle.length / ownerPrefs.compatible_lifestyle_tags.length;
        criteria.push({
            weight: 15,
            matches: matchRate >= 0.25,
            reason: `${sharedLifestyle.length} shared lifestyle values`,
            incompatibleReason: 'Lifestyle preferences don\'t align much'
        });
    }

    // Children compatibility
    if (ownerPrefs.allows_children !== undefined) {
        const clientHasChildren = clientProfile.has_children || false;
        const childrenCompatible = ownerPrefs.allows_children || !clientHasChildren;
        if (!childrenCompatible) {
            incompatibleReasons.push('Has children but not allowed');
        }
    }

    // Smoking habit compatibility
    if (ownerPrefs.smoking_habit && clientProfile.smoking_habit) {
        const smokingCompatible = ownerPrefs.smoking_habit === clientProfile.smoking_habit;
        if (!smokingCompatible) {
            incompatibleReasons.push('Smoking habits incompatible');
        }
    }

    // Occupation alignment
    if (ownerPrefs.preferred_occupations?.length && clientProfile.work_schedule) {
        criteria.push({
            weight: 10,
            matches: ownerPrefs.preferred_occupations.includes(clientProfile.work_schedule),
            reason: `Occupation (${clientProfile.work_schedule}) matches your preference`,
            incompatibleReason: `Occupation (${clientProfile.work_schedule}) not in preferred list`
        });
    }

    // Gender matching
    if (ownerPrefs.selected_genders?.length && !ownerPrefs.selected_genders.includes('Any Gender')) {
        const genderMatch = clientProfile.gender && ownerPrefs.selected_genders.includes(clientProfile.gender);
        criteria.push({
            weight: 10,
            matches: genderMatch,
            reason: `Gender ${clientProfile.gender} matches preferences`,
            incompatibleReason: `Gender does not match your filter`
        });
    }

    // Verification status boost
    if (clientProfile.verified || clientProfile.onboarding_completed) {
        criteria.push({
            weight: 15,
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

    const percentage = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 75;

    return {
        percentage,
        reasons: Array.from(new Set(matchedReasons)),
        incompatible: Array.from(new Set(incompatibleReasons))
    };
}


