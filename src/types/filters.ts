/**
 * UNIFIED FILTER TYPES
 * Single source of truth for all filter-related types
 * Used by: QuickFilterBar, QuickFilterDropdown, CascadeFilterButton, CollapsibleFilterButton
 */

/**
 * Available listing categories
 * These are the UI representation values
 * IMPORTANT: Only properties, motos, bicycles, and services are supported
 */
export type QuickFilterCategory =
  | 'property'
  | 'motorcycle'  // ALWAYS use 'motorcycle' not 'moto'
  | 'bicycle'
  | 'services';   // UI name (maps to 'worker' in database)

/**
 * Listing types for property rentals
 * IMPORTANT: Use 'rent' not 'rental' for consistency
 */
export type QuickFilterListingType = 'rent' | 'sale' | 'both';

/**
 * Client gender filter for owner dashboard
 * 'any' = show all genders (default)
 */
export type ClientGender = 'male' | 'female' | 'other' | 'any' | 'all';

/**
 * Client type filter for owner dashboard
 * 'all' = show all types (default)
 */
export type ClientType = 'individual' | 'family' | 'business' | 'hire' | 'rent' | 'buy' | 'all';

/**
 * Quick filter interface
 * Used for both client and owner quick filter UI
 */
export interface QuickFilters {
  // Listing filters (for clients browsing listings)
  categories: QuickFilterCategory[];  // Required, default to []
  category?: QuickFilterCategory;
  listingType: QuickFilterListingType;  // Required, default to 'both'

  // Client filters (for owners browsing clients)
  clientGender: ClientGender;  // Required, default to 'any'
  clientType: ClientType;  // Required, default to 'all'

  // Advanced filters (applied from AdvancedFilters dialog)
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  budgetRange?: [number, number];
  moveInTimeframe?: string;

  // Special flags
  activeCategory?: QuickFilterCategory;
}

/**
 * Default quick filters state
 */
export const defaultQuickFilters: QuickFilters = {
  categories: [],
  listingType: 'both',
  clientGender: 'any',
  clientType: 'all',
};

/**
 * Category configuration for UI display
 */
export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Category display configuration map
 */
export const categoryConfig: Record<QuickFilterCategory, CategoryConfig> = {
  property: {
    label: 'Property',
    icon: '🏠',
    color: 'bg-blue-500',
    description: 'Houses, apartments, rooms'
  },
  motorcycle: {
    label: 'Motorcycle',
    icon: '🏍️',
    color: 'bg-slate-500',
    description: 'Motorcycles, scooters, bikes'
  },
  bicycle: {
    label: 'Bicycle',
    icon: '🚴',
    color: 'bg-yellow-500',
    description: 'Bicycles, e-bikes'
  },
  services: {
    label: 'Services',
    icon: '🛠️',
    color: 'bg-purple-500',
    description: 'Workers, contractors, services'
  }
};

/**
 * Maps UI category names to database category names
 * Only needed for legacy support - prefer using database names directly
 */
export const categoryToDatabase: Record<string, string> = {
  'property': 'property',
  'motorcycle': 'motorcycle',
  'moto': 'motorcycle',  // Legacy support
  'bicycle': 'bicycle',
  'services': 'worker',  // UI shows "Services", DB uses "worker"
  'worker': 'worker'
};

/**
 * Normalizes a category string to database format
 */
export function normalizeCategoryName(category: string | undefined): string | undefined {
  if (!category) return undefined;
  return categoryToDatabase[category.toLowerCase()] || category;
}

/**
 * Listing filters interface
 * Extended version that includes all filter properties used across the app
 */
export interface ListingFilters {
  // Category filters
  category?: QuickFilterCategory | string;
  categories?: (QuickFilterCategory | string)[];
  
  // Listing type
  listingType?: QuickFilterListingType;
  
  // Property-specific filters
  propertyType?: string[];
  priceRange?: [number, number];
  bedrooms?: number[];
  bathrooms?: number[];
  amenities?: string[];
  distance?: number;
  
  // Boolean flags
  premiumOnly?: boolean;
  verified?: boolean;
  petFriendly?: boolean;
  furnished?: boolean;
  
  // Lifestyle filters
  lifestyleTags?: string[];
  dietaryPreferences?: string[];
  
  // Services/worker filter
  showHireServices?: boolean;
  
  // Owner client filters
  clientGender?: ClientGender;
  clientType?: ClientType;
}
