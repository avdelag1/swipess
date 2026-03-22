/**
 * CENTRALIZED FILTER STATE STORE
 * 
 * Single source of truth for all filter state across the app.
 * Ensures instant UI updates with background data fetching.
 * 
 * KEY PRINCIPLES:
 * 1. Filter changes are SYNCHRONOUS - UI updates immediately
 * 2. Data fetching happens in BACKGROUND - never blocks UI
 * 3. Category switching CLEARS cards immediately, then loads new ones
 * 4. No duplicate filter states across components
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  QuickFilterCategory, 
  QuickFilterListingType, 
  ClientGender, 
  ClientType,
  QuickFilters,
  ListingFilters
} from '@/types/filters';
import { logger } from '@/utils/prodLogger';

// Read localStorage to set initial categories on store creation
function getInitialCategories(): QuickFilterCategory[] {
  try {
    const saved = localStorage.getItem('quickFilter');
    const map: Record<string, QuickFilterCategory[]> = {
      properties: ['property'],
      motorcycles: ['motorcycle'],
      bicycles: ['bicycle'],
      workers: ['services'],
    };
    return map[saved ?? ''] ?? [];
  } catch {
    return [];
  }
}

interface FilterState {
  // ========== CLIENT FILTERS ==========
  // Active category for client swipe deck
  activeCategory: QuickFilterCategory | null;
  categories: QuickFilterCategory[];
  listingType: QuickFilterListingType;
  
  // ========== OWNER FILTERS ==========
  // Client filters for owner swipe deck
  clientGender: ClientGender;
  clientType: ClientType;
  clientAgeRange: [number, number] | null;
  clientBudgetRange: [number, number] | null;
  clientNationalities: string[];
  
  // ========== DISTANCE FILTER ==========
  radiusKm: number;
  userLatitude: number | null;
  userLongitude: number | null;

  // ========== ADVANCED FILTERS ==========
  priceRange: [number, number] | null;
  bedrooms: number[];
  bathrooms: number[];
  amenities: string[];
  propertyTypes: string[];
  
  // ========== STATE FLAGS ==========
  // Version number that increments on every filter change
  // Swipe containers watch this to know when to reset their decks
  filterVersion: number;
  
  // Timestamp of last filter change for cache invalidation
  lastChangedAt: number;
  
  // ========== ACTIONS ==========
  // Category actions
  setActiveCategory: (category: QuickFilterCategory | null) => void;
  toggleCategory: (category: QuickFilterCategory) => void;
  setCategories: (categories: QuickFilterCategory[]) => void;
  
  // Listing type actions
  setListingType: (type: QuickFilterListingType) => void;
  
  // Owner filter actions
  setClientGender: (gender: ClientGender) => void;
  setClientType: (type: ClientType) => void;
  setClientAgeRange: (range: [number, number] | null) => void;
  setClientBudgetRange: (range: [number, number] | null) => void;
  setClientNationalities: (nationalities: string[]) => void;
  
  // Distance filter actions
  setRadiusKm: (radius: number) => void;
  setUserLocation: (lat: number, lon: number) => void;
  clearUserLocation: () => void;

  // Advanced filter actions
  setPriceRange: (range: [number, number] | null) => void;
  setBedrooms: (bedrooms: number[]) => void;
  setBathrooms: (bathrooms: number[]) => void;
  setAmenities: (amenities: string[]) => void;
  setPropertyTypes: (types: string[]) => void;
  
  // Bulk update
  setFilters: (filters: Partial<QuickFilters>) => void;
  
  // Reset actions
  resetClientFilters: () => void;
  resetOwnerFilters: () => void;
  resetAllFilters: () => void;
  
  // Getters
  getQuickFilters: () => QuickFilters;
  getListingFilters: () => ListingFilters;
  getClientFilters: () => ClientFiltersShape;
  hasActiveFilters: (role: 'client' | 'owner') => boolean;
  getActiveFilterCount: (role: 'client' | 'owner') => number;
}

// Map UI category to database category
const mapCategoryToDb = (category: QuickFilterCategory): string => {
  if (category === 'services') return 'worker';
  return category;
};

// Shape that useSmartClientMatching expects (from smartMatching/types.ts)
interface ClientFiltersShape {
  clientGender?: string;
  clientType?: string;
  ageRange?: [number, number];
  budgetRange?: [number, number];
  nationalities?: string[];
  categories?: string[];
  genders?: string[];
}

export const useFilterStore = create<FilterState>()(
  subscribeWithSelector((set, get) => ({
    // ========== INITIAL STATE ==========
    activeCategory: null,
    categories: getInitialCategories(),
    listingType: 'both',
    clientGender: 'any',
    clientType: 'all',
    clientAgeRange: null,
    clientBudgetRange: null,
    clientNationalities: [],
    radiusKm: 50,
    userLatitude: null,
    userLongitude: null,
    priceRange: null,
    bedrooms: [],
    bathrooms: [],
    amenities: [],
    propertyTypes: [],
    filterVersion: 0,
    lastChangedAt: Date.now(),

    // ========== DISTANCE FILTER ACTIONS ==========
    setRadiusKm: (radius) => {
      set((state) => ({
        radiusKm: radius,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setUserLocation: (lat, lon) => {
      set({ userLatitude: lat, userLongitude: lon });
    },
    clearUserLocation: () => {
      set({ userLatitude: null, userLongitude: null });
    },

    // ========== CATEGORY ACTIONS ==========
    setActiveCategory: (category) => {
      if (get().activeCategory === category) return;
      logger.info('[FilterStore] setActiveCategory:', category);
      set((state) => ({
        activeCategory: category,
        // When setting active category, also update categories array
        categories: category ? [category] : [],
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    toggleCategory: (category) => {
      logger.info('[FilterStore] toggleCategory:', category);
      set((state) => {
        const isActive = state.categories.includes(category);
        const newCategories = isActive
          ? state.categories.filter(c => c !== category)
          : [...state.categories, category];
        
        return {
          categories: newCategories,
          activeCategory: newCategories.length === 1 ? newCategories[0] : null,
          filterVersion: state.filterVersion + 1,
          lastChangedAt: Date.now(),
        };
      });
    },
    
    setCategories: (categories) => {
      logger.info('[FilterStore] setCategories:', categories);
      set((state) => ({
        categories,
        activeCategory: categories.length === 1 ? categories[0] : null,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    // ========== LISTING TYPE ACTIONS ==========
    setListingType: (type) => {
      logger.info('[FilterStore] setListingType:', type);
      set((state) => ({
        listingType: type,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    // ========== OWNER FILTER ACTIONS ==========
    setClientGender: (gender) => {
      logger.info('[FilterStore] setClientGender:', gender);
      set((state) => ({
        clientGender: gender,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setClientType: (type) => {
      logger.info('[FilterStore] setClientType:', type);
      set((state) => ({
        clientType: type,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setClientAgeRange: (range) => {
      set((state) => ({
        clientAgeRange: range,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setClientBudgetRange: (range) => {
      set((state) => ({
        clientBudgetRange: range,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setClientNationalities: (nationalities) => {
      set((state) => ({
        clientNationalities: nationalities,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    // ========== ADVANCED FILTER ACTIONS ==========
    setPriceRange: (range) => {
      set((state) => ({
        priceRange: range,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setBedrooms: (bedrooms) => {
      set((state) => ({
        bedrooms,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setBathrooms: (bathrooms) => {
      set((state) => ({
        bathrooms,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setAmenities: (amenities) => {
      set((state) => ({
        amenities,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    setPropertyTypes: (types) => {
      set((state) => ({
        propertyTypes: types,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    // ========== BULK UPDATE ==========
    setFilters: (filters) => {
      logger.info('[FilterStore] setFilters:', filters);
      set((state) => ({
        ...(filters.categories !== undefined && { categories: filters.categories }),
        ...(filters.category !== undefined && { activeCategory: filters.category }),
        ...(filters.listingType !== undefined && { listingType: filters.listingType }),
        ...(filters.clientGender !== undefined && { clientGender: filters.clientGender }),
        ...(filters.clientType !== undefined && { clientType: filters.clientType }),
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    // ========== RESET ACTIONS ==========
    resetClientFilters: () => {
      logger.info('[FilterStore] resetClientFilters');
      set((state) => ({
        activeCategory: null,
        categories: [],
        listingType: 'both',
        priceRange: null,
        bedrooms: [],
        bathrooms: [],
        amenities: [],
        propertyTypes: [],
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    resetOwnerFilters: () => {
      logger.info('[FilterStore] resetOwnerFilters');
      set((state) => ({
        activeCategory: null,
        categories: [],
        listingType: 'both',
        clientGender: 'any',
        clientType: 'all',
        clientAgeRange: null,
        clientBudgetRange: null,
        clientNationalities: [],
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    resetAllFilters: () => {
      logger.info('[FilterStore] resetAllFilters');
      set((state) => ({
        activeCategory: null,
        categories: [],
        listingType: 'both',
        clientGender: 'any',
        clientType: 'all',
        priceRange: null,
        bedrooms: [],
        bathrooms: [],
        amenities: [],
        propertyTypes: [],
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    
    // ========== GETTERS ==========
    getQuickFilters: () => {
      const state = get();
      return {
        categories: state.categories,
        category: state.activeCategory ?? undefined,
        listingType: state.listingType,
        clientGender: state.clientGender,
        clientType: state.clientType,
        activeCategory: state.activeCategory ?? undefined,
      };
    },
    
    getListingFilters: () => {
      const state = get();
      const hasServices = state.categories.includes('services');
      
      return {
        category: state.activeCategory ?? undefined,
        categories: state.categories.map(mapCategoryToDb),
        listingType: state.listingType,
        propertyType: state.propertyTypes.length > 0 ? state.propertyTypes : undefined,
        priceRange: state.priceRange ?? undefined,
        bedrooms: state.bedrooms.length > 0 ? state.bedrooms : undefined,
        bathrooms: state.bathrooms.length > 0 ? state.bathrooms : undefined,
        amenities: state.amenities.length > 0 ? state.amenities : undefined,
        showHireServices: hasServices || undefined,
        clientGender: state.clientGender !== 'any' ? state.clientGender : undefined,
        clientType: state.clientType !== 'all' ? state.clientType : undefined,
        ageRange: state.clientAgeRange ?? undefined,
        budgetRange: state.clientBudgetRange ?? undefined,
        nationalities: state.clientNationalities.length > 0 ? state.clientNationalities : undefined,
      };
    },

    // ── OWNER CLIENT FILTERS ─────────────────────────────────────────────────
    // Maps owner filter store state to the ClientFilters shape expected by
    // useSmartClientMatching. This is the CORRECT bridge between the two systems.
    getClientFilters: () => {
      const state = get();
      return {
        // Gender: map single value to array (hook expects string[])
        clientGender: state.clientGender !== 'any' ? state.clientGender : undefined,
        genders: state.clientGender !== 'any' ? [state.clientGender] : undefined,
        // Client type (rent/buy/hire/individual/family/business)
        clientType: state.clientType !== 'all' ? state.clientType : undefined,
        // Age range
        ageRange: state.clientAgeRange ?? undefined,
        // Budget range
        budgetRange: state.clientBudgetRange ?? undefined,
        // Nationality list
        nationalities: state.clientNationalities.length > 0 ? state.clientNationalities : undefined,
        // Category from owner's perspective (what they offer)
        categories: state.categories.map(mapCategoryToDb),
      };
    },
    
    hasActiveFilters: (role) => {
      const state = get();
      if (role === 'client') {
        return state.categories.length > 0 || state.listingType !== 'both';
      }
      return state.clientGender !== 'any' || state.clientType !== 'all' || state.categories.length > 0 || state.listingType !== 'both';
    },
    
    getActiveFilterCount: (role) => {
      const state = get();
      if (role === 'client') {
        return state.categories.length + (state.listingType !== 'both' ? 1 : 0);
      }
      return (state.clientGender !== 'any' ? 1 : 0) + (state.clientType !== 'all' ? 1 : 0) + (state.clientAgeRange ? 1 : 0) + (state.clientBudgetRange ? 1 : 0) + (state.clientNationalities.length > 0 ? 1 : 0) + state.categories.length + (state.listingType !== 'both' ? 1 : 0);
    },
  }))
);

// ========== SELECTOR HOOKS ==========
// These provide optimized subscriptions to specific parts of state

export const useActiveCategory = () => useFilterStore((state) => state.activeCategory);
export const useCategories = () => useFilterStore((state) => state.categories);
export const useListingType = () => useFilterStore((state) => state.listingType);
export const useClientGender = () => useFilterStore((state) => state.clientGender);
export const useClientType = () => useFilterStore((state) => state.clientType);
export const useFilterVersion = () => useFilterStore((state) => state.filterVersion);

// Combined selectors for quick filter UI
// PERF FIX: Use useShallow to prevent re-renders when values haven't changed
import { useShallow } from 'zustand/react/shallow';

export const useQuickFilters = () => useFilterStore(useShallow((state) => ({
  categories: state.categories,
  listingType: state.listingType,
  clientGender: state.clientGender,
  clientType: state.clientType,
})));

// Filter actions hook
// PERF FIX: Use useShallow — action references are stable but the object wrapper is new each time
export const useFilterActions = () => useFilterStore(useShallow((state) => ({
  setActiveCategory: state.setActiveCategory,
  toggleCategory: state.toggleCategory,
  setCategories: state.setCategories,
  setListingType: state.setListingType,
  setClientGender: state.setClientGender,
  setClientType: state.setClientType,
  setFilters: state.setFilters,
  resetClientFilters: state.resetClientFilters,
  resetOwnerFilters: state.resetOwnerFilters,
  resetAllFilters: state.resetAllFilters,
})));
