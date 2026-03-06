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
  colorClassName: {
    dark: string;
    light: string;
  };
  gradientClassName: {
    dark: string;
    light: string;
  };
  textColorClassName: {
    dark: string;
    light: string;
  };
}

/**
 * Category display configuration map
 * Colors are theme-aware and work well in both dark (black-matte) and light (white-matte) modes
 */
export const categoryConfig: Record<QuickFilterCategory, CategoryConfig> = {
  property: {
    label: 'Property',
    icon: '🏠',
    color: 'bg-blue-500', // Legacy fallback
    colorClassName: {
      dark: 'bg-blue-600',
      light: 'bg-blue-500'
    },
    gradientClassName: {
      dark: 'from-blue-600 to-cyan-600',
      light: 'from-blue-500 to-cyan-500'
    },
    textColorClassName: {
      dark: 'text-blue-400',
      light: 'text-blue-600'
    },
    description: 'Houses, apartments, rooms'
  },
  motorcycle: {
    label: 'Motorcycle',
    icon: '🏍️',
    color: 'bg-slate-500', // Legacy fallback
    colorClassName: {
      dark: 'bg-slate-600',
      light: 'bg-slate-500'
    },
    gradientClassName: {
      dark: 'from-slate-600 to-zinc-600',
      light: 'from-slate-500 to-zinc-500'
    },
    textColorClassName: {
      dark: 'text-slate-400',
      light: 'text-slate-600'
    },
    description: 'Motorcycles, scooters, bikes'
  },
  bicycle: {
    label: 'Bicycle',
    icon: '🚴',
    color: 'bg-yellow-500', // Legacy fallback
    colorClassName: {
      dark: 'bg-amber-500',
      light: 'bg-yellow-500'
    },
    gradientClassName: {
      dark: 'from-amber-600 to-yellow-600',
      light: 'from-yellow-500 to-amber-500'
    },
    textColorClassName: {
      dark: 'text-amber-400',
      light: 'text-amber-600'
    },
    description: 'Bicycles, e-bikes'
  },
  services: {
    label: 'Services',
    icon: '🛠️',
    color: 'bg-purple-500', // Legacy fallback
    colorClassName: {
      dark: 'bg-emerald-600',
      light: 'bg-emerald-500'
    },
    gradientClassName: {
      dark: 'from-emerald-600 to-green-600',
      light: 'from-emerald-500 to-green-500'
    },
    textColorClassName: {
      dark: 'text-emerald-400',
      light: 'text-emerald-600'
    },
    description: 'Workers, contractors, services'
  }
};

/**
 * Get the theme-aware color class for a category
 * @param category The category to get color for
 * @param isDarkTheme Whether the current theme is dark mode
 * @returns The Tailwind color class for the category in the current theme
 */
export function getCategoryColorClass(
  category: QuickFilterCategory,
  isDarkTheme: boolean = true
): string {
  const config = categoryConfig[category];
  if (!config) return 'bg-gray-500';
  return config.colorClassName[isDarkTheme ? 'dark' : 'light'];
}

/**
 * Get the theme-aware gradient class for a category
 * @param category The category to get gradient for
 * @param isDarkTheme Whether the current theme is dark mode
 * @returns The Tailwind gradient class for the category in the current theme
 */
export function getCategoryGradientClass(
  category: QuickFilterCategory,
  isDarkTheme: boolean = true
): string {
  const config = categoryConfig[category];
  if (!config) return 'from-gray-500 to-slate-500';
  return config.gradientClassName[isDarkTheme ? 'dark' : 'light'];
}

/**
 * Get the theme-aware text color class for a category
 * @param category The category to get text color for
 * @param isDarkTheme Whether the current theme is dark mode
 * @returns The Tailwind text color class for the category in the current theme
 */
export function getCategoryTextColorClass(
  category: QuickFilterCategory,
  isDarkTheme: boolean = true
): string {
  const config = categoryConfig[category];
  if (!config) return 'text-gray-400';
  return config.textColorClassName[isDarkTheme ? 'dark' : 'light'];
}

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
  const normalized = category.toLowerCase().trim();
  // Remove trailing 's' if not 'services' to handle plurals
  const singular = normalized === 'services' ? normalized : normalized.replace(/s$/, '');
  return categoryToDatabase[singular] || categoryToDatabase[normalized] || normalized;
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
