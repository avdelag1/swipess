import { create } from 'zustand';

export type DashboardMode = 'client' | 'owner';

export interface DiscoverItem {
  id: string;
  type: 'user' | 'listing' | 'vehicle' | 'service' | 'worker';
  title: string;
  photo: string;
  lat: number;
  lng: number;
  distanceKm: number;
  category: string;
  rating?: number;
  isVerified: boolean;
  isVIP?: boolean;
  lastActiveAt?: string;
  isActive: boolean;
}

interface MapState {
  // Discovery Core
  dashboardMode: DashboardMode;
  userLocation: { lat: number; lng: number } | null;
  radiusKm: number;
  activeFilters: string[];
  
  // UI State
  isRefreshing: boolean;
  selectedItemId: string | null;
  seenItems: Set<string>;
  vibe: 'light' | 'dark' | 'art';
  
  // Actions
  setDashboardMode: (mode: DashboardMode) => void;
  setUserLocation: (lat: number, lng: number) => void;
  setRadiusKm: (km: number) => void;
  toggleFilter: (filterId: string) => void;
  setIsRefreshing: (val: boolean) => void;
  selectItem: (id: string | null) => void;
  markAsSeen: (id: string) => void;
  setVibe: (vibe: 'light' | 'dark' | 'art') => void;
  clearSeenItems: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  dashboardMode: 'client',
  userLocation: { lat: 20.2114, lng: -87.4654 }, // Tulum Default
  radiusKm: 5,
  activeFilters: [],
  isRefreshing: false,
  selectedItemId: null,
  seenItems: new Set(),
  vibe: 'dark',

  setDashboardMode: (mode) => set({ dashboardMode: mode }),
  setUserLocation: (lat, lng) => set({ userLocation: { lat, lng } }),
  setRadiusKm: (km) => set({ radiusKm: km }),
  toggleFilter: (f) => set((s) => ({
    activeFilters: s.activeFilters.includes(f) 
      ? s.activeFilters.filter((x) => x !== f) 
      : [...s.activeFilters, f]
  })),
  setIsRefreshing: (val) => set({ isRefreshing: val }),
  selectItem: (id) => set({ selectedItemId: id }),
  markAsSeen: (id) => set((s) => {
    const next = new Set(s.seenItems);
    next.add(id);
    return { seenItems: next };
  }),
  setVibe: (v) => set({ vibe: v }),
  clearSeenItems: () => set({ seenItems: new Set() }),
}));
