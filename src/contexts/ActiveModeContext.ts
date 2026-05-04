import { createContext } from 'react';

export type ActiveMode = 'client' | 'owner';

export interface ActiveModeContextType {
  activeMode: ActiveMode;
  isLoading: boolean;
  isSwitching: boolean;
  initialized: boolean;
  switchMode: (newMode: ActiveMode) => void;
  toggleMode: () => void;
  syncMode: (newMode: ActiveMode) => void;
  canSwitchMode: boolean;
}

// Stable singleton context — lives in its own leaf module so eager + lazy
// chunks always resolve to the same context instance (prevents duplicate
// createContext() calls under HMR / lazy chunk reloads).
export const ActiveModeContext = createContext<ActiveModeContextType | undefined>(undefined);