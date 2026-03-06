import { Listing } from '../useListings';
import { ClientFilterPreferences } from '../useClientFilterPreferences';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Fisher-Yates shuffle algorithm for randomizing array order
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper function to check if images contain mock/fake/placeholder URLs
export function hasMockImages(images: string[] | null | undefined): boolean {
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
