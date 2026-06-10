import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isOnboardingActive: boolean;
  markOnboardingSeen: () => void;
  setOnboardingActive: (val: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      isOnboardingActive: false,
      markOnboardingSeen: () => set({ hasSeenOnboarding: true }),
      setOnboardingActive: (val: boolean) => set({ isOnboardingActive: val }),
    }),
    {
      name: 'swipess-onboarding-storage',
      // Only persist the hasSeenOnboarding flag, not the active session flag
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
    }
  )
);
