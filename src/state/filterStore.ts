/**
 * CENTRALIZED FILTER STATE STORE
 * 
 * Single source of truth for all filter state across the app.
 * Ensures instant UI updates with background data fetching.
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { 
  ClientGender, 
  ClientType, 
  ListingFilters, 
  QuickFilterCategory,
  QuickFilterListingType,
  QuickFilters
} from '@/types/filters';

/** Default discovery radius — 1 km was too tight for first-open empty decks. */
export const DEFAULT_RADIUS_KM = 50;

// Accent color lookup for categories (from SwipeConstants)
const CATEGORY_ACCENTS: Record<string, string> = {
  property: '#3b82f6',
  motorcycle: '#f97316',
  bicycle: '#f43f5e',
  services: '#EB4898',
  pros: '#a855f7',
  events: '#ec4899',
  leads: '#06b6d4',
  all: '#06b6d4',
  vap: '#10b981',
  buyers: '#3b82f6',
  renters: '#10b981',
  hire: '#EB4898',
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
  userLocationUpdatedAt: number | null;
  /** True when user teleported via Global Passport (not physical GPS). */
  passportMode: boolean;
  /** Display label for passport destination, e.g. "Paris, France". */
  passportLabel: string | null;

  // ========== ADVANCED FILTERS ==========
  priceRange: [number, number] | null;
  bedrooms: number[];
  bathrooms: number[];
  amenities: string[];
  propertyTypes: string[];
  serviceTypes: string[];
  motoTypes: string[];
  bicycleTypes: string[];
  yachtTypes: string[];
  furnished: boolean;
  petFriendly: boolean;
  
  filterVersion: number;

  ownerPhase: 'cards' | 'kilometer' | 'swipe';

  // ========== QUICK FILTER CARD POSITIONS ==========
  // Persist the rotation order of poker-style category cards so returning
  // from a filtered deck lands on the same card the user was viewing.
  pokerCardOrder: string[] | null;

  // ACTIONS
  setActiveCategory: (category: QuickFilterCategory | null) => void;
  setOwnerPhase: (phase: 'cards' | 'kilometer' | 'swipe') => void;
  setPokerCardOrder: (order: string[]) => void;
  toggleCategory: (category: QuickFilterCategory) => void;
  setCategories: (categories: QuickFilterCategory[]) => void;
  /** Single filterVersion bump when picking a bento category + listing type. */
  selectDeckCategory: (category: QuickFilterCategory, listingType: QuickFilterListingType) => void;
  setListingType: (type: QuickFilterListingType) => void;
  setClientGender: (gender: ClientGender) => void;
  setClientType: (type: ClientType) => void;
  setClientAgeRange: (range: [number, number] | null) => void;
  setClientBudgetRange: (range: [number, number] | null) => void;
  setClientNationalities: (nationalities: string[]) => void;
  setRadiusKm: (radius: number) => void;
  setUserLocation: (lat: number, lon: number) => void;
  clearStaleLocation: () => void;
  setPassportLocation: (lat: number, lon: number, label?: string) => void;
  clearPassportLocation: () => void;
  clearUserLocation: () => void;
  setPriceRange: (range: [number, number] | null) => void;
  setBedrooms: (bedrooms: number[]) => void;
  setBathrooms: (bathrooms: number[]) => void;
  setAmenities: (amenities: string[]) => void;
  setPropertyTypes: (types: string[]) => void;
  setServiceTypes: (types: string[]) => void;
  setMotoTypes: (types: string[]) => void;
  setBicycleTypes: (types: string[]) => void;
  setYachtTypes: (types: string[]) => void;
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
  propertyTypes?: string[];
  motoTypes?: string[];
  bicycleTypes?: string[];
  yachtTypes?: string[];
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
    radiusKm: DEFAULT_RADIUS_KM,
    userLatitude: null,
    userLongitude: null,
    userLocationUpdatedAt: null,
    passportMode: false,
    passportLabel: null,
    priceRange: null,
    bedrooms: [],
    bathrooms: [],
    amenities: [],
    propertyTypes: [],
    serviceTypes: [],
    motoTypes: [],
    bicycleTypes: [],
    yachtTypes: [],
    furnished: false,
    petFriendly: false,
    filterVersion: 0,

    ownerPhase: 'cards',
    pokerCardOrder: null,

    // ACTIONS
    setOwnerPhase: (phase) => {
      set({ ownerPhase: phase });
    },
    setPokerCardOrder: (order) => set({ pokerCardOrder: order }),

    setRadiusKm: (radius) => {
      set((state) => ({
        radiusKm: radius,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setUserLocation: (lat, lon) => {
      set((state) => ({
        userLatitude: lat,
        userLongitude: lon,
        userLocationUpdatedAt: Date.now(),
        passportMode: false,
        passportLabel: null,
        filterVersion: state.filterVersion + 1,
      }));
    },
    clearStaleLocation: () => {
      set((state) => {
        if (!state.userLocationUpdatedAt || Date.now() - state.userLocationUpdatedAt > 24 * 60 * 60 * 1000) {
          return {
            userLatitude: null,
            userLongitude: null,
            userLocationUpdatedAt: null,
            filterVersion: state.filterVersion + 1,
          };
        }
        return {};
      });
    },
    setPassportLocation: (lat, lon, label) => {
      set((state) => ({
        userLatitude: lat,
        userLongitude: lon,
        passportMode: true,
        passportLabel: label ?? null,
        filterVersion: state.filterVersion + 1,
      }));
    },
    clearPassportLocation: () => {
      set((state) => ({
        passportMode: false,
        passportLabel: null,
        filterVersion: state.filterVersion + 1,
      }));
    },
    updateFilters: (filters: Record<string, any>) => {
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
        if (filters.moto_types) mapped.motoTypes = filters.moto_types;
        if (filters.bicycle_types) mapped.bicycleTypes = filters.bicycle_types;
        if (filters.radius_km !== undefined) mapped.radiusKm = filters.radius_km;
        if (filters.budget_min !== undefined || filters.budget_max !== undefined) {
          mapped.priceRange = [filters.budget_min || 0, filters.budget_max || 1000000];
        }
        if (filters.bedrooms_min !== undefined) {
          const maxBed = filters.bedrooms_max ?? filters.max_bedrooms
            ?? (state.bedrooms.length > 1 ? state.bedrooms[1] : 10);
          mapped.bedrooms = [filters.bedrooms_min, maxBed];
        }
        if (filters.interest_type && filters.interest_type !== 'both') {
          mapped.listingType = filters.interest_type;
        }

        return {
          ...mapped,
          filterVersion: state.filterVersion + 1,
        };
      });
    },
    clearUserLocation: () => {
      set((state) => ({
        userLatitude: null,
        userLongitude: null,
        passportMode: false,
        passportLabel: null,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setActiveCategory: (category) => {
      const state = get();
      if (state.activeCategory === category && (category !== null || state.categories.length === 0)) return;
      set((state) => ({
        activeCategory: category,
        categories: category ? [category] : [],
        accentColor: category ? (CATEGORY_ACCENTS[category] ?? null) : null,
        filterVersion: state.filterVersion + 1,
      }));
    },
    toggleCategory: (category) => {
      set((state) => {
        const isActive = state.categories.includes(category);
        const newCategories = isActive
          ? state.categories.filter(c => c !== category)
          : [...state.categories, category];
        const single = newCategories.length === 1 ? newCategories[0] : null;
        return {
          categories: newCategories,
          activeCategory: single,
          accentColor: single ? (CATEGORY_ACCENTS[single] ?? null) : null,
          filterVersion: state.filterVersion + 1,
        };
      });
    },
    selectDeckCategory: (category, listingType) => {
      const state = get();
      if (
        state.activeCategory === category
        && state.categories.length === 1
        && state.categories[0] === category
        && state.listingType === listingType
      ) return;
      set({
        activeCategory: category,
        categories: [category],
        accentColor: CATEGORY_ACCENTS[category] ?? null,
        listingType,
        filterVersion: state.filterVersion + 1,
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
      }));
    },
    setListingType: (type) => {
      if (get().listingType === type) return;
      set((state) => ({
        listingType: type,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setClientGender: (gender) => {
      set((state) => ({
        clientGender: gender,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setClientType: (type) => {
      set((state) => ({
        clientType: type,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setClientAgeRange: (range) => {
      set((state) => ({
        clientAgeRange: range,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setClientBudgetRange: (range) => {
      set((state) => ({
        clientBudgetRange: range,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setClientNationalities: (nationalities) => {
      set((state) => ({
        clientNationalities: nationalities,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setPriceRange: (range) => {
      set((state) => ({
        priceRange: range,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setBedrooms: (bedrooms) => {
      set((state) => ({
        bedrooms,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setBathrooms: (bathrooms) => {
      set((state) => ({
        bathrooms,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setAmenities: (amenities) => {
      set((state) => ({
        amenities,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setPropertyTypes: (types) => {
      set((state) => ({
        propertyTypes: types,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setServiceTypes: (types) => {
      set((state) => ({
        serviceTypes: types,
        filterVersion: state.filterVersion + 1,
      }));
    },
    setMotoTypes: (types) => {
      set((state) => ({ motoTypes: types, filterVersion: state.filterVersion + 1 }));
    },
    setBicycleTypes: (types) => {
      set((state) => ({ bicycleTypes: types, filterVersion: state.filterVersion + 1 }));
    },
    setYachtTypes: (types) => {
      set((state) => ({ yachtTypes: types, filterVersion: state.filterVersion + 1 }));
    },
    setFilters: (filters: Record<string, unknown>) => {
      set((state) => ({
        ...(filters.categories !== undefined && { categories: filters.categories as QuickFilterCategory[] }),
        ...((filters.category !== undefined || filters.activeCategory !== undefined) && {
          activeCategory: (filters.activeCategory ?? filters.category) as QuickFilterCategory | null,
        }),
        ...(filters.listingType !== undefined && { listingType: filters.listingType as FilterState['listingType'] }),
        ...(filters.clientGender !== undefined && { clientGender: filters.clientGender as FilterState['clientGender'] }),
        ...(filters.clientType !== undefined && { clientType: filters.clientType as FilterState['clientType'] }),
        ...(filters.userLatitude !== undefined && { userLatitude: filters.userLatitude as number | null }),
        ...(filters.userLongitude !== undefined && { userLongitude: filters.userLongitude as number | null }),
        ...(filters.radiusKm !== undefined && { radiusKm: filters.radiusKm as number }),
        ...(filters.passportMode !== undefined && { passportMode: filters.passportMode as boolean }),
        ...(filters.passportLabel !== undefined && { passportLabel: filters.passportLabel as string | null }),
        ...(filters.priceRange !== undefined && { priceRange: filters.priceRange as [number, number] | null }),
        ...(filters.bedrooms !== undefined && { bedrooms: filters.bedrooms as number[] }),
        ...(filters.bathrooms !== undefined && { bathrooms: filters.bathrooms as number[] }),
        ...(filters.amenities !== undefined && { amenities: filters.amenities as string[] }),
        ...(filters.propertyTypes !== undefined && { propertyTypes: filters.propertyTypes as string[] }),
        ...(filters.serviceTypes !== undefined && { serviceTypes: filters.serviceTypes as string[] }),
        ...(filters.furnished !== undefined && { furnished: filters.furnished as boolean }),
        ...(filters.petFriendly !== undefined && { petFriendly: filters.petFriendly as boolean }),
        ...(filters.motoTypes !== undefined && { motoTypes: filters.motoTypes as string[] }),
        ...(filters.bicycleTypes !== undefined && { bicycleTypes: filters.bicycleTypes as string[] }),
        ...(filters.yachtTypes !== undefined && { yachtTypes: filters.yachtTypes as string[] }),
        ...(filters.clientAgeRange !== undefined && { clientAgeRange: filters.clientAgeRange as [number, number] | null }),
        ...(filters.clientBudgetRange !== undefined && { clientBudgetRange: filters.clientBudgetRange as [number, number] | null }),
        ...(filters.clientNationalities !== undefined && { clientNationalities: filters.clientNationalities as string[] }),
        ...(filters.accentColor !== undefined && { accentColor: filters.accentColor as string | null }),
        filterVersion: state.filterVersion + 1,
      }));
    },
    resetClientFilters: () => {
      set((state) => ({
        activeCategory: null,
        categories: [],
        accentColor: null,
        listingType: 'both',
        priceRange: null,
        bedrooms: [],
        bathrooms: [],
        amenities: [],
        propertyTypes: [],
        serviceTypes: [],
        motoTypes: [],
        bicycleTypes: [],
        yachtTypes: [],
        furnished: false,
        petFriendly: false,
        radiusKm: DEFAULT_RADIUS_KM,
        filterVersion: state.filterVersion + 1,
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
      const result: any = {
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
        passportMode: state.passportMode,
        petFriendly: state.petFriendly || undefined,
        furnished: state.furnished || undefined,
      };
      if (state.serviceTypes.length > 0) result.serviceTypes = state.serviceTypes;
      if (state.motoTypes.length > 0) result.motoTypes = state.motoTypes;
      if (state.bicycleTypes.length > 0) result.bicycleTypes = state.bicycleTypes;
      if (state.yachtTypes.length > 0) result.yachtTypes = state.yachtTypes;

      return result;
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
        propertyTypes: state.propertyTypes.length > 0 ? state.propertyTypes : undefined,
        motoTypes: state.motoTypes.length > 0 ? state.motoTypes : undefined,
        bicycleTypes: state.bicycleTypes.length > 0 ? state.bicycleTypes : undefined,
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
        // NOTE: activeCategory is intentionally NOT persisted. Persisting it
        // made the app reopen straight into the last category's swipe deck,
        // hiding the quick-filter photo-card dashboard. The dashboard must be
        // the landing view; tapping a card sets the category for the session.
        listingType: state.listingType,
        clientGender: state.clientGender,
        clientType: state.clientType,
        userLatitude: state.userLatitude,
        userLongitude: state.userLongitude,
        passportMode: state.passportMode,
        passportLabel: state.passportLabel,
        radiusKm: state.radiusKm,
        priceRange: state.priceRange,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        amenities: state.amenities,
        propertyTypes: state.propertyTypes,
        serviceTypes: state.serviceTypes,
        motoTypes: state.motoTypes,
        bicycleTypes: state.bicycleTypes,
        furnished: state.furnished,
        petFriendly: state.petFriendly,
        clientAgeRange: state.clientAgeRange,
        clientBudgetRange: state.clientBudgetRange,
        clientNationalities: state.clientNationalities,
        pokerCardOrder: state.pokerCardOrder,
        ownerPokerCardOrder: state.ownerPokerCardOrder,
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
  selectDeckCategory: state.selectDeckCategory,
  setListingType: state.setListingType,
  setClientGender: state.setClientGender,
  setClientType: state.setClientType,
  setFilters: state.setFilters,
  updateFilters: state.updateFilters,
  resetClientFilters: state.resetClientFilters,
  resetOwnerFilters: state.resetOwnerFilters,
  resetAllFilters: state.resetAllFilters,
})));


