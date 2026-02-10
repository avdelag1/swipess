import { useState, useCallback, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { useSwipeDeckStore } from '@/state/swipeDeckStore';

export type ActiveMode = 'client' | 'owner';

interface ActiveModeContextType {
  activeMode: ActiveMode;
  isLoading: boolean;
  isSwitching: boolean;
  switchMode: (newMode: ActiveMode) => void;
  toggleMode: () => void;
  syncMode: (newMode: ActiveMode) => void;
  canSwitchMode: boolean;
}

const ActiveModeContext = createContext<ActiveModeContextType | undefined>(undefined);

// Local storage key for persistent mode (survives page refresh)
const MODE_STORAGE_KEY = 'swipess_active_mode';

// Get cached mode from localStorage (synchronous, instant, persistent)
function getCachedMode(userId: string | undefined): ActiveMode | null {
  if (!userId) return null;
  try {
    const cached = localStorage.getItem(`${MODE_STORAGE_KEY}_${userId}`);
    return cached === 'client' || cached === 'owner' ? cached : null;
  } catch {
    return null;
  }
}

// Cache mode to localStorage (persistent across sessions)
function setCachedMode(userId: string, mode: ActiveMode): void {
  try {
    localStorage.setItem(`${MODE_STORAGE_KEY}_${userId}`, mode);
  } catch {
    // localStorage unavailable
  }
}

// Page mapping for navigation between modes
const PAGE_MAPPING: Record<string, Record<string, string>> = {
  client: {
    dashboard: '/owner/dashboard',
    profile: '/owner/profile',
    settings: '/owner/settings',
    security: '/owner/security',
    contracts: '/owner/contracts',
    'saved-searches': '/owner/dashboard',
    'worker-discovery': '/owner/dashboard',
  },
  owner: {
    dashboard: '/client/dashboard',
    profile: '/client/profile',
    settings: '/client/settings',
    security: '/client/security',
    contracts: '/client/contracts',
    listings: '/client/dashboard',
    'new-listing': '/client/dashboard',
  },
};

export function ActiveModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get deck reset functions to clear opposite mode's deck when switching
  const resetClientDeck = useSwipeDeckStore((state) => state.resetClientDeck);
  const resetOwnerDeck = useSwipeDeckStore((state) => state.resetOwnerDeck);

  // Initialize from localStorage synchronously - instant, no flash
  const [localMode, setLocalMode] = useState<ActiveMode>(() => {
    return getCachedMode(user?.id) || 'client';
  });
  const [isSwitching, setIsSwitching] = useState(false);

  // Update initial mode when user changes
  useEffect(() => {
    if (user?.id) {
      const cached = getCachedMode(user.id);
      if (cached && cached !== localMode) {
        setLocalMode(cached);
      }
    }
  }, [user?.id]);

  // Fetch from database in background (only for initial sync)
  const { isLoading, isFetched } = useQuery({
    queryKey: ['active-mode', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('active_mode')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // Don't throw - local cache is source of truth
        logger.error('[ActiveMode] Error fetching mode:', error);
        return null;
      }

      const dbMode = (data?.active_mode as ActiveMode) || 'client';

      // Only sync from DB if we don't have a local cache
      const cachedMode = getCachedMode(user.id);
      if (!cachedMode) {
        setCachedMode(user.id, dbMode);
        setLocalMode(dbMode);
      }

      return dbMode;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Never refetch automatically
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Save mode to database in background (fire and forget)
  const saveModeToDatabase = useCallback(async (newMode: ActiveMode) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({
          active_mode: newMode,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Update query cache
      queryClient.setQueryData(['active-mode', user.id], newMode);
    } catch (error) {
      // Silent fail - local cache is already updated
      logger.error('[ActiveMode] Background save failed:', error);
    }
  }, [user?.id, queryClient]);

  // Get target path for navigation
  const getTargetPath = useCallback((newMode: ActiveMode): string => {
    const currentPath = location.pathname;

    if (currentPath.includes('/client/') || currentPath.includes('/owner/')) {
      const currentPageType = currentPath.split('/').pop() || 'dashboard';
      const fromMode = currentPath.includes('/client/') ? 'client' : 'owner';

      return PAGE_MAPPING[fromMode]?.[currentPageType] ||
             (newMode === 'client' ? '/client/dashboard' : '/owner/dashboard');
    }

    return newMode === 'client' ? '/client/dashboard' : '/owner/dashboard';
  }, [location.pathname]);

  // FAST mode switch - everything happens synchronously
  const switchMode = useCallback((newMode: ActiveMode) => {
    // CRITICAL: Prevent mode switch if already switching or if mode is the same
    // This prevents accidental rapid clicks or event bubbling from causing unwanted switches
    if (!user?.id || isSwitching || newMode === localMode) {
      logger.info('[ActiveMode] switchMode blocked:', {
        hasUser: !!user?.id,
        isSwitching,
        newMode,
        currentMode: localMode
      });
      return;
    }

    // 1. Set switching flag
    setIsSwitching(true);

    // 2. Haptic feedback
    triggerHaptic('medium');

    // 3. Update local state IMMEDIATELY
    setLocalMode(newMode);

    // 4. Cache to localStorage IMMEDIATELY (persistent)
    setCachedMode(user.id, newMode);

    // 5. Update query cache IMMEDIATELY
    queryClient.setQueryData(['active-mode', user.id], newMode);

    // 6. Clear opposite mode's deck to prevent flash
    if (newMode === 'client') {
      // Switching to client mode, clear all owner decks
      ['property', 'moto', 'motorcycle', 'bicycle', 'services', 'worker', 'default'].forEach((category) => {
        resetOwnerDeck(category);
      });
    } else {
      // Switching to owner mode, clear client deck
      resetClientDeck();
    }

    // 7. Navigate IMMEDIATELY
    const targetPath = getTargetPath(newMode);
    navigate(targetPath, { replace: true });

    // 8. Show success toast
    toast({
      title: `Switched to ${newMode === 'client' ? 'I Can Do' : 'I Need'} mode`,
      description: newMode === 'client'
        ? 'Now offering properties, bikes, motors & services'
        : 'Now browsing deals, services and properties',
    });

    // 8. Success haptic
    triggerHaptic('success');

    // 9. Reset switching flag
    setIsSwitching(false);

    // 10. Save to database in background (fire and forget)
    saveModeToDatabase(newMode);

  }, [user?.id, isSwitching, localMode, queryClient, getTargetPath, navigate, saveModeToDatabase, resetClientDeck, resetOwnerDeck]);

  // Toggle between modes
  const toggleMode = useCallback(() => {
    const newMode = localMode === 'client' ? 'owner' : 'client';
    switchMode(newMode);
  }, [localMode, switchMode]);

  // Sync mode without navigation (used for route-based sync)
  const syncMode = useCallback((newMode: ActiveMode) => {
    if (!user?.id || newMode === localMode) {
      return;
    }

    // Update local state
    setLocalMode(newMode);

    // Cache to localStorage (persistent)
    setCachedMode(user.id, newMode);

    // Update query cache
    queryClient.setQueryData(['active-mode', user.id], newMode);

    // Save to database in background (fire and forget)
    saveModeToDatabase(newMode);
  }, [user?.id, localMode, queryClient, saveModeToDatabase]);

  // Allow all authenticated users to switch
  const canSwitchMode = !!user?.id;

  const value = useMemo(() => ({
    activeMode: localMode,
    isLoading: isLoading && !isFetched,
    isSwitching,
    switchMode,
    toggleMode,
    syncMode,
    canSwitchMode,
  }), [localMode, isLoading, isFetched, isSwitching, switchMode, toggleMode, syncMode, canSwitchMode]);

  return (
    <ActiveModeContext.Provider value={value}>
      {children}
    </ActiveModeContext.Provider>
  );
}

export function useActiveMode() {
  const context = useContext(ActiveModeContext);
  if (context === undefined) {
    throw new Error('useActiveMode must be used within an ActiveModeProvider');
  }
  return context;
}

// Standalone hook for components that just need to read the mode
export function useActiveModeQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['active-mode', userId],
    queryFn: async () => {
      // First check localStorage (source of truth)
      const cached = getCachedMode(userId);
      if (cached) return cached;

      if (!userId) return 'client' as ActiveMode;

      const { data, error } = await supabase
        .from('profiles')
        .select('active_mode')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('[ActiveMode] Query error:', error);
        return 'client' as ActiveMode;
      }

      const mode = (data?.active_mode as ActiveMode) || 'client';
      setCachedMode(userId, mode);
      return mode;
    },
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: getCachedMode(userId) || 'client',
  });
}
