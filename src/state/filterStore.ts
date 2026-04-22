/**
 * CENTRALIZED FILTER STATE STORE
 * 
 * Single source of truth for all filter state across the app.
 * Ensures instant UI updates with background data fetching.
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { 
  QuickFilterCategory, 
  QuickFilterListingType, 
  ClientGender, 
  ClientType,
  QuickFilters,
  ListingFilters
} from '@/types/filters';

// Accent color lookup for categories (from SwipeConstants)
const CATEGORY_ACCENTS: Record<string, string> = {
  property: '#3b82f6',
  motorcycle: '#f97316',
  bicycle: '#f43f5e',
  services: '#a855f7',
  all: '#06b6d4',
  vap: '#10b981',
  buyers: '#3b82f6',
  renters: '#10b981',
  hire: '#a855f7',
  'all-clients': '#06b6d4',
  lawyer: '#6366f1',
  promote: '#ec4899',
};



interface FilterState {
  // ========== CLIENT FILTERS ==========
  activeCategory: QuickFilterCategory | null;
  categories: QuickFilterCategory[];
  listingType: QuickFilterListingType;
  accentColor: string | null;
  
  // ========== OWNER FILTERS ==========
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
  serviceTypes: string[];
  furnished: boolean;
  petFriendly: boolean;
  
  filterVersion: number;
  lastChangedAt: number;
  
  // ACTIONS
  setActiveCategory: (category: QuickFilterCategory | null) => void;
  toggleCategory: (category: QuickFilterCategory) => void;
  setCategories: (categories: QuickFilterCategory[]) => void;
  setListingType: (type: QuickFilterListingType) => void;
  setClientGender: (gender: ClientGender) => void;
  setClientType: (type: ClientType) => void;
  setClientAgeRange: (range: [number, number] | null) => void;
  setClientBudgetRange: (range: [number, number] | null) => void;
  setClientNationalities: (nationalities: string[]) => void;
  setRadiusKm: (radius: number) => void;
  setUserLocation: (lat: number, lon: number) => void;
  clearUserLocation: () => void;
  setPriceRange: (range: [number, number] | null) => void;
  setBedrooms: (bedrooms: number[]) => void;
  setBathrooms: (bathrooms: number[]) => void;
  setAmenities: (amenities: string[]) => void;
  setPropertyTypes: (types: string[]) => void;
  setServiceTypes: (types: string[]) => void;
  setFilters: (filters: Partial<QuickFilters>) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  resetClientFilters: () => void;
  resetOwnerFilters: () => void;
  resetAllFilters: () => void;
  getQuickFilters: () => QuickFilters;
  getListingFilters: () => ListingFilters;
  getClientFilters: () => ClientFiltersShape;
  hasActiveFilters: (role: 'client' | 'owner') => boolean;
  getActiveFilterCount: (role: 'client' | 'owner') => number;
}

const mapCategoryToDb = (category: QuickFilterCategory): string => {
  if (category === 'services') return 'worker';
  return category;
};

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
  persist(
    subscribeWithSelector((set, get) => ({
      // ========== INITIAL STATE ==========
      activeCategory: null,
      categories: [],
    listingType: 'both',
    accentColor: null,
    clientGender: 'any',
    clientType: 'all',
    clientAgeRange: null,
    clientBudgetRange: null,
    clientNationalities: [],
    radiusKm: 1,
    userLatitude: null,
    userLongitude: null,
    priceRange: null,
    bedrooms: [],
    bathrooms: [],
    amenities: [],
    propertyTypes: [],
    serviceTypes: [],
    furnished: false,
    petFriendly: false,
    filterVersion: 0,
    lastChangedAt: Date.now(),

    // ACTIONS
    setRadiusKm: (radius) => {
      logger.info('[FilterStore] radiusKm changed to:', radius);
      set((state) => ({
        radiusKm: radius,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setUserLocation: (lat, lon) => {
      logger.info('[FilterStore] userLocation changed:', lat, lon);
      set((state) => ({ 
        userLatitude: lat, 
        userLongitude: lon,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    updateFilters: (filters: Record<string, any>) => {
      logger.info('[FilterStore] updateFilters called with:', filters);
      set((state) => {
        const mapped: any = {};
        // Map snake_case from UI components to camelCase store state
        if (filters.property_types) mapped.propertyTypes = filters.property_types;
        if (filters.listing_types) mapped.listingType = filters.listing_types[0] || 'both';
        if (filters.price_min !== undefined || filters.price_max !== undefined) {
          mapped.priceRange = [filters.price_min || 0, filters.price_max || 1000000];
        }
        if (filters.min_bedrooms !== undefined || filters.max_bedrooms !== undefined) {
          mapped.bedrooms = [filters.min_bedrooms || 0, filters.max_bedrooms || 10];
        }
        if (filters.min_bathrooms !== undefined || filters.max_bathrooms !== undefined) {
          mapped.bathrooms = [filters.min_bathrooms || 0, filters.max_bathrooms || 5];
        }
        if (filters.furnished !== undefined) mapped.furnished = filters.furnished;
        if (filters.pet_friendly !== undefined) mapped.petFriendly = filters.pet_friendly;
        
        // Demographic mapping
        if (filters.gender_preference) mapped.clientGender = filters.gender_preference;
        if (filters.nationalities) mapped.clientNationalities = filters.nationalities;
        
        // Service mapping
        if (filters.service_categories) mapped.serviceTypes = filters.service_categories;

        return {
          ...mapped,
          filterVersion: state.filterVersion + 1,
          lastChangedAt: Date.now(),
        };
      });
    },
    clearUserLocation: () => {
      logger.info('[FilterStore] clearUserLocation');
      set((state) => ({ 
        userLatitude: null, 
        userLongitude: null,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setActiveCategory: (category) => {
      if (get().activeCategory === category) return;
      logger.info('[FilterStore] activeCategory changed to:', category);
      set((state) => ({
        activeCategory: category,
        categories: category ? [category] : [],
        accentColor: category ? (CATEGORY_ACCENTS[category] ?? null) : null,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    toggleCategory: (category) => {
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
      const current = get().categories;
      if (current.length === categories.length && categories.every((c, i) => current[i] === c)) return;
      const activeCategory = categories.length === 1 ? categories[0] : null;
      set((state) => ({
        categories,
        activeCategory,
        accentColor: activeCategory ? (CATEGORY_ACCENTS[activeCategory] ?? null) : null,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setListingType: (type) => {
      set((state) => ({
        listingType: type,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setClientGender: (gender) => {
      set((state) => ({
        clientGender: gender,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setClientType: (type) => {
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
    setServiceTypes: (types) => {
      set((state) => ({
        serviceTypes: types,
        filterVersion: state.filterVersion + 1,
        lastChangedAt: Date.now(),
      }));
    },
    setFilters: (filters) => {
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
    resetClientFilters: () => {
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
      return {
        category: state.activeCategory ?? undefined,
        categories: state.categories.map(mapCategoryToDb),
        listingType: state.listingType,
        propertyType: state.propertyTypes.length > 0 ? state.propertyTypes : undefined,
        priceRange: state.priceRange ?? undefined,
        bedrooms: state.bedrooms.length > 0 ? state.bedrooms : undefined,
        bathrooms: state.bathrooms.length > 0 ? state.bathrooms : undefined,
        amenities: state.amenities.length > 0 ? state.amenities : undefined,
        showHireServices: state.categories.includes('services') || undefined,
        clientGender: state.clientGender !== 'any' ? state.clientGender : undefined,
        clientType: state.clientType !== 'all' ? state.clientType : undefined,
        ageRange: state.clientAgeRange ?? undefined,
        budgetRange: state.clientBudgetRange ?? undefined,
        nationalities: state.clientNationalities.length > 0 ? state.clientNationalities : undefined,
        radiusKm: state.radiusKm,
        userLatitude: state.userLatitude ?? undefined,
        userLongitude: state.userLongitude ?? undefined,
        serviceCategory: state.serviceTypes.length > 0 ? state.serviceTypes : undefined,
        petFriendly: state.petFriendly || undefined,
        furnished: state.furnished || undefined,
      };
    },
    getClientFilters: () => {
      const state = get();
      return {
        clientGender: state.clientGender !== 'any' ? state.clientGender : undefined,
        genders: state.clientGender !== 'any' ? [state.clientGender] : undefined,
        clientType: state.clientType !== 'all' ? state.clientType : undefined,
        ageRange: state.clientAgeRange ?? undefined,
        budgetRange: state.clientBudgetRange ?? undefined,
        nationalities: state.clientNationalities.length > 0 ? state.clientNationalities : undefined,
        categories: state.categories.map(mapCategoryToDb),
      };
    },
    hasActiveFilters: (role) => {
      const state = get();
      if (role === 'client') return state.categories.length > 0 || state.listingType !== 'both';
      return state.clientGender !== 'any' || state.clientType !== 'all' || state.categories.length > 0 || state.listingType !== 'both';
    },
      getActiveFilterCount: (role) => {
        const state = get();
        if (role === 'client') return state.categories.length + (state.listingType !== 'both' ? 1 : 0);
        return (state.clientGender !== 'any' ? 1 : 0) + (state.clientType !== 'all' ? 1 : 0) + (state.clientAgeRange ? 1 : 0) + (state.clientBudgetRange ? 1 : 0) + (state.clientNationalities.length > 0 ? 1 : 0) + state.categories.length + (state.listingType !== 'both' ? 1 : 0);
      },
    })),
    {
      name: 'Swipess-filter-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        categories: state.categories, 
        activeCategory: state.activeCategory, 
        listingType: state.listingType,
        clientGender: state.clientGender,
        clientType: state.clientType,
        userLatitude: state.userLatitude,
        userLongitude: state.userLongitude,
        radiusKm: state.radiusKm,
        furnished: state.furnished,
        petFriendly: state.petFriendly
      }), // only persist these fields
    }
  )
);

// SELECTOR HOOKS
export const useActiveCategory = () => useFilterStore((state) => state.activeCategory);
export const useCategories = () => useFilterStore((state) => state.categories);
export const useListingType = () => useFilterStore((state) => state.listingType);
export const useClientGender = () => useFilterStore((state) => state.clientGender);
export const useClientType = () => useFilterStore((state) => state.clientType);
export const useFilterVersion = () => useFilterStore((state) => state.filterVersion);


export const useQuickFilters = () => useFilterStore(useShallow((state) => ({
  categories: state.categories,
  listingType: state.listingType,
  clientGender: state.clientGender,
  clientType: state.clientType,
})));

export const useFilterActions = () => useFilterStore(useShallow((state) => ({
  setActiveCategory: state.setActiveCategory,
  toggleCategory: state.toggleCategory,
  setCategories: state.setCategories,
  setListingType: state.setListingType,
  setClientGender: state.setClientGender,
  setClientType: state.setClientType,
  setFilters: state.setFilters,
  updateFilters: state.updateFilters,
  resetClientFilters: state.resetClientFilters,
  resetOwnerFilters: state.resetOwnerFilters,
  resetAllFilters: state.resetAllFilters,
})));


