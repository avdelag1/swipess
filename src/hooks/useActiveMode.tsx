import { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode, useMemo, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { useSwipeDeckStore } from '@/state/swipeDeckStore';
import { useFilterStore } from '@/state/filterStore';

export type ActiveMode = 'client' | 'owner';

interface ActiveModeContextType {
  activeMode: ActiveMode;
  isLoading: boolean;
  isSwitching: boolean;
  initialized: boolean; // TRUE when both auth and initial mode fetch are done
  switchMode: (newMode: ActiveMode) => void;
  toggleMode: () => void;
  syncMode: (newMode: ActiveMode) => void;
  canSwitchMode: boolean;
}

const ActiveModeContext = createContext<ActiveModeContextType | undefined>(undefined);

// Local storage key for persistent mode (survives page refresh)
const MODE_STORAGE_KEY = 'swipess_active_mode';
const SWITCH_TIMEOUT_MS = 100; // Accelerated cooldown for 'Boom' feel


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
    properties: '/client/dashboard',
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
  const [_isPending, _startTransition] = useTransition();

  // Update initial mode when user changes; reset on logout
  useEffect(() => {
    if (user?.id) {
      // 🚀 SPEED OF LIGHT: Deriving from metadata first is more stable than defaulting to 'client'
      const cached = getCachedMode(user.id);
      const metadataRole = user.user_metadata?.role as ActiveMode | undefined;
      const initialRole = (cached || metadataRole || 'client') as ActiveMode;
      
      if (initialRole !== localMode) {
        setLocalMode(initialRole);
        // Persist metadata role to cache if cache was empty
        if (!cached && metadataRole) {
          setCachedMode(user.id, metadataRole);
        }
      }
    } else {
      // User logged out — reset to default and clear stale cache entries
      setLocalMode('client');
      queryClient.removeQueries({ queryKey: ['active-mode'] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch from database in background (only for initial sync)
  const { isLoading, isFetched } = useQuery({
    queryKey: ['active-mode', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('active_mode')
        .eq('user_id', user.id)
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

  // Sync refs with state to maintain stable callbacks
  const localModeRef = useRef<ActiveMode>(localMode);
  useEffect(() => {
    localModeRef.current = localMode;
  }, [localMode]);

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
        .eq('user_id', user.id);

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

    // Default paths
    const defaultPaths = {
      client: '/client/dashboard',
      owner: '/owner/dashboard'
    };

    // If currently on a client/owner explicit route, try to map it
    if (currentPath.includes('/client/') || currentPath.includes('/owner/')) {
      const fromMode = currentPath.includes('/client/') ? 'client' : 'owner';

      // If we're already on the correct mode path due to some race condition, just return it
      if (fromMode === newMode) return currentPath;

      // Extract the specific page name after /client/ or /owner/
      // E.g., /client/dashboard -> dashboard, /owner/settings -> settings
      const pathParts = currentPath.split('/');
      const modeIdx = pathParts.indexOf(fromMode);
      const currentPageType = pathParts[modeIdx + 1] || 'dashboard';

      // Look up where this page maps to in the OTHER mode
      const mappedPath = PAGE_MAPPING[fromMode]?.[currentPageType];
      if (mappedPath) {
        return mappedPath;
      }
    }

    // Default fallback
    return defaultPaths[newMode];
  }, [location.pathname]);

  // FAST mode switch - everything happens synchronously
  const switchMode = useCallback((newMode: ActiveMode) => {
    // CRITICAL: Use ref for comparison to prevent dependency on localMode
    // This prevents accidental rapid clicks or event bubbling from causing unwanted switches
    if (!user?.id || isSwitching || newMode === localModeRef.current) {
      if (!user?.id) logger.warn('[ActiveMode] switchMode blocked: No user');
      return;
    }

    // 1. Set switching flag
    setIsSwitching(true);

    // 2. Haptic feedback - trigger IMMEDIATELY for perceived speed
    triggerHaptic('medium');

    // 3. Update local state IMMEDIATELY
    setLocalMode(newMode);

    // 4. Cache to localStorage IMMEDIATELY (persistent)
    setCachedMode(user.id, newMode);

    // 5. Update query cache IMMEDIATELY
    queryClient.setQueryData(['active-mode', user.id], newMode);

    // 6. Clear opposite mode's deck to prevent flash (Optimized: check if actually has data)
    if (newMode === 'client') {
      ['property', 'moto', 'motorcycle', 'bicycle', 'services', 'worker', 'default'].forEach((category) => {
        resetOwnerDeck(category);
      });
    } else {
      resetClientDeck();
    }

    // Reset filters so client/owner filter selections don't carry across modes
    useFilterStore.getState().resetAllFilters();

    // 7. Navigate with error handling
    try {
      const targetPath = getTargetPath(newMode);
      
      // REPLACED Transitions: Swipess jumps instantly to the new Dashboard.
      // Mode Switching is now synchronous and Direct-to-Source.
      navigate(targetPath, { replace: true });
    } catch (navError) {
      logger.error('[ActiveMode] Navigation failed:', navError);
      navigate(newMode === 'client' ? '/client/dashboard' : '/owner/dashboard', { replace: true });
    }

    // 8. Show success toast (non-blocking)
    appToast.info(
      newMode === 'client' ? 'Client Dashboard' : 'Owner Dashboard',
      newMode === 'client'
        ? 'Browsing deals, services and properties'
        : 'Managing listings and discovering clients'
    );

    // 9. Success haptic
    triggerHaptic('success');

    // 10. Save to database in background (fire and forget)
    saveModeToDatabase(newMode);

    // 11. Reset switching flag after a short delay to cover navigation render time
    // This prevents double-clicks but ensures the UI doesn't look "stuck"
    setTimeout(() => {
      setIsSwitching(false);
    }, SWITCH_TIMEOUT_MS);

  }, [user?.id, isSwitching, queryClient, getTargetPath, navigate, saveModeToDatabase, resetClientDeck, resetOwnerDeck]);

  // Toggle between modes
  const toggleMode = useCallback(() => {
    const newMode = localModeRef.current === 'client' ? 'owner' : 'client';
    switchMode(newMode);
  }, [switchMode]);

  // Sync mode without navigation (used for route-based sync)
  const syncMode = useCallback((newMode: ActiveMode) => {
    // CRITICAL: Use ref for comparison to keep callback stable
    if (!user?.id || newMode === localModeRef.current) {
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
  }, [user?.id, queryClient, saveModeToDatabase]);

  // Allow all authenticated users to switch
  const canSwitchMode = !!user?.id;

  const value = useMemo(() => ({
    activeMode: localMode,
    isLoading: isLoading && !isFetched,
    isSwitching,
    initialized: isFetched,
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
        .eq('user_id', userId)
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
