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
  | 'services'   // UI name (maps to 'worker' in database)
  | 'all-clients'
  | 'buyers'
  | 'renters'
  | 'hire';

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
    color: 'bg-zinc-500', // Legacy fallback
    colorClassName: {
      dark: 'bg-zinc-600',
      light: 'bg-zinc-500'
    },
    gradientClassName: {
      dark: 'from-zinc-600 to-black',
      light: 'from-zinc-500 to-zinc-700'
    },
    textColorClassName: {
      dark: 'text-zinc-400',
      light: 'text-zinc-600'
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
      dark: 'bg-rose-600',
      light: 'bg-rose-500'
    },
    gradientClassName: {
      dark: 'from-rose-600 to-violet-600',
      light: 'from-rose-500 to-violet-500'
    },
    textColorClassName: {
      dark: 'text-rose-400',
      light: 'text-rose-600'
    },
    description: 'Workers, contractors, services'
  },
  'all-clients': {
    label: 'All Clients',
    icon: 'users',
    color: 'bg-cyan-500',
    colorClassName: { dark: 'bg-cyan-600', light: 'bg-cyan-500' },
    gradientClassName: { dark: 'from-cyan-600 to-sky-600', light: 'from-cyan-500 to-sky-500' },
    textColorClassName: { dark: 'text-cyan-400', light: 'text-cyan-600' },
    description: 'Everyone seeking a match'
  },
  buyers: {
    label: 'Buyers',
    icon: 'shopping-bag',
    color: 'bg-blue-500',
    colorClassName: { dark: 'bg-blue-600', light: 'bg-blue-500' },
    gradientClassName: { dark: 'from-blue-600 to-indigo-600', light: 'from-blue-500 to-indigo-500' },
    textColorClassName: { dark: 'text-blue-400', light: 'text-blue-600' },
    description: 'Purchase-ready clients'
  },
  renters: {
    label: 'Renters',
    icon: 'key',
    color: 'bg-indigo-500',
    colorClassName: { dark: 'bg-indigo-600', light: 'bg-indigo-500' },
    gradientClassName: { dark: 'from-indigo-600 to-violet-600', light: 'from-indigo-500 to-violet-500' },
    textColorClassName: { dark: 'text-indigo-400', light: 'text-indigo-600' },
    description: 'Move-ready renters'
  },
  hire: {
    label: 'Workers',
    icon: 'briefcase',
    color: 'bg-violet-500',
    colorClassName: { dark: 'bg-violet-600', light: 'bg-violet-500' },
    gradientClassName: { dark: 'from-violet-600 to-fuchsia-600', light: 'from-violet-500 to-fuchsia-500' },
    textColorClassName: { dark: 'text-violet-400', light: 'text-violet-600' },
    description: 'Service-seeking clients'
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
  if (!config) return 'bg-zinc-500';
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
  if (!config) return 'from-zinc-500 to-zinc-600';
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
  if (!config) return 'text-zinc-400';
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
  radiusKm?: number;
  userLatitude?: number;
  userLongitude?: number;
  premiumOnly?: boolean;
  verified?: boolean;
  petFriendly?: boolean;
  furnished?: boolean;

  // Lifestyle filters
  lifestyleTags?: string[];
  dietaryPreferences?: string[];

  // Services/worker filter
  showHireServices?: boolean;

  // Worker-specific filters (must match smartMatching/types.ts)
  serviceCategory?: string[];
  workTypes?: string[];
  scheduleTypes?: string[];
  daysAvailable?: string[];
  timeSlotsAvailable?: string[];
  locationTypes?: string[];
  experienceLevel?: string[];
  skills?: string[];
  certifications?: string[];

  // Worker boolean verification filters
  offersEmergencyService?: boolean;
  backgroundCheckVerified?: boolean;
  insuranceVerified?: boolean;

  // Owner client filters
  clientGender?: ClientGender;
  clientType?: ClientType;
}


