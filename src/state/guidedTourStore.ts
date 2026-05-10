import { create } from 'zustand';

interface GuidedTourState {
  isActive: boolean;
  setActive: (active: boolean) => void;
}

/**
 * Tiny global flag so non-tour components (Concierge launcher, Welcome
 * modal, etc.) can hide / lock themselves while the tour is running.
 * The tour itself still owns step state inside `useGuidedTour`.
 */
export const useGuidedTourActive = create<GuidedTourState>((set) => ({
  isActive: false,
  setActive: (active) => set({ isActive: active }),
}));