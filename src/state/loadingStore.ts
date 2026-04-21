import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  activeCount: number;
  start: () => void;
  finish: () => void;
  setProgress: (progress: number) => void;
}

/**
 * LOADING STORE — THE "SPEED OF LIGHT" ENGINE
 * 
 * Tracks multiple concurrent loading states (Lazy Loads, API Fetch, Navigation)
 * and calculates a unified "progress" value for the global LoadingBar.
 */
export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  progress: 0,
  activeCount: 0,
  
  start: () => set((state) => {
    const newCount = state.activeCount + 1;
    return {
      activeCount: newCount,
      isLoading: true,
      // Reset progress when first task starts
      progress: newCount === 1 ? 10 : state.progress
    };
  }),
  
  finish: () => set((state) => {
    const newCount = Math.max(0, state.activeCount - 1);
    const finishing = newCount === 0;
    return {
      activeCount: newCount,
      isLoading: !finishing,
      progress: finishing ? 100 : state.progress
    };
  }),

  setProgress: (progress: number) => set({ progress }),
}));

