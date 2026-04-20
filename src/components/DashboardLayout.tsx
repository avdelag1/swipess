import React, { ReactNode, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useAnonymousDrafts } from "@/hooks/useAnonymousDrafts"
import { supabase } from '@/integrations/supabase/client'
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from "react-router-dom";
import { useResponsiveContext } from '@/contexts/ResponsiveContext'
import { prefetchRoleRoutes, createLinkObserver } from '@/utils/routePrefetcher'
import { useLayoutEffect } from 'react'
import { logger } from '@/utils/prodLogger'
import { useTheme } from '@/hooks/useTheme'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories } from '@/state/filterStore'
import { QuickFilterCategory } from '@/types/filters'


// Note: TopBar, SwipessLogo, BottomNavigation are now rendered by AppLayout.tsx (global HUD)

// SPEED OF LIGHT HOOKS
import { useWelcomeState } from "@/hooks/useWelcomeState"
import { LoadingBar } from './ui/LoadingBar';
import { GlobalDialogs } from './GlobalDialogs'
import { useModalStore } from '@/state/modalStore'
import { useFocusMode } from '@/hooks/useFocusMode'
import { useScrollDirection } from '@/hooks/useScrollDirection'

// =============================================================================
// PERFORMANCE FIX: SessionStorage caching for dashboard checks
// Prevents visible state changes when returning to dashboard
// =============================================================================

const ONBOARDING_CACHE_KEY = 'dashboard_onboarding_check';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface OnboardingCacheEntry {
  userId: string;
  needsOnboarding: boolean;
  checkedAt: number;
}

function getOnboardingCache(userId: string): OnboardingCacheEntry | null {
  try {
    const cached = sessionStorage.getItem(ONBOARDING_CACHE_KEY);
    if (!cached) return null;

    const entry: OnboardingCacheEntry = JSON.parse(cached);

    // Validate cache: same user and not expired
    if (entry.userId !== userId) return null;
    if (Date.now() - entry.checkedAt > CACHE_EXPIRY_MS) return null;

    return entry;
  } catch {
    return null;
  }
}

function setOnboardingCache(userId: string, needsOnboarding: boolean): void {
  try {
    const entry: OnboardingCacheEntry = {
      userId,
      needsOnboarding,
      checkedAt: Date.now(),
    };
    sessionStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

function _clearOnboardingCache(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_CACHE_KEY);
  } catch {
    // Ignore
  }
}

// =============================================================================

interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'client' | 'owner' | 'admin'
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || theme === 'cheers' || theme === 'nexus-style';
  const [_showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  
  const modalStore = useModalStore()

  const { navigate } = useAppNavigate();
  const location = useLocation()
  const { user } = useAuth()
  const { restoreDrafts } = useAnonymousDrafts()
  const responsive = useResponsiveContext()

  // 🛡️ HUD MASTER RECOVERY: Ensure UI is visible on mount and every navigation
  useEffect(() => {
    // Force recovery on mount/navigation
    const recoveryEvent = new CustomEvent('sentient-ui-recovery');
    window.dispatchEvent(recoveryEvent);
    
    // Safety net: second attempt after 1.5s to ensure splash has cleared
    const safetyCheck = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sentient-ui-recovery'));
    }, 1500);

    return () => clearTimeout(safetyCheck);
  }, [location.pathname]);

  // NEXT-GEN DESIGN: Mouse tracking for liquid glass effects (throttled to ~30fps)
  // PERF: Disabled on PWA/touch devices to save CPU and battery
  useEffect(() => {
    // Only enable on desktop with mouse
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let rafId = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return; 
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
        rafId = 0;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // PERF: Extract stable userId to prevent re-renders when user object reference changes
  // User object may get new reference on token refresh, but ID stays the same
  const userId = user?.id

  // Track if we've checked cache synchronously on mount
  const cacheCheckedRef = useRef(false);

  // PERFORMANCE FIX: Welcome state with DB-backed persistence
  // Shows welcome only on first signup, not every login (survives localStorage clears)
  const { shouldShowWelcome: _shouldShowWelcome, dismissWelcome: _dismissWelcome } = useWelcomeState(userId)

  const queryClient = useQueryClient();

  // PERF: Defer route prefetching until after first paint using requestIdleCallback
  // This ensures dashboard renders instantly without blocking on prefetch
  useEffect(() => {
    if (userRole === 'client' || userRole === 'owner') {
      if ('requestIdleCallback' in window) {
        const idleId = (window as any).requestIdleCallback(() => prefetchRoleRoutes(userRole), { timeout: 800 });
        return () => (window as any).cancelIdleCallback(idleId);
      } else {
        const timeoutId = setTimeout(() => prefetchRoleRoutes(userRole), 300);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userRole]);

  // PERF: Prefetch secondary page data and critical lazy components
  useEffect(() => {
    if (!userId) return;
    
    // ... prefetch logic ...
  }, [userId, userRole, queryClient]);

  // REMOVED: useListings and useClientProfiles moved to GlobalDialogs

  // ==========================================================================
  // PERF FIX: Onboarding check with sessionStorage caching
  // 1. Check cache SYNCHRONOUSLY on mount - no state change if cached
  // 2. Only do async DB check if no valid cache exists
  // 3. Cache result for 5 minutes to prevent re-checks on navigation
  // ==========================================================================
  useEffect(() => {
    if (!userId || onboardingChecked) return;

    // SYNCHRONOUS CACHE CHECK - prevents visible state change on return
    if (!cacheCheckedRef.current) {
      cacheCheckedRef.current = true;
      const cached = getOnboardingCache(userId);
      if (cached) {
        setOnboardingChecked(true);
        if (cached.needsOnboarding) {
          setShowOnboarding(true);
        }
        return; // Skip DB check entirely
      }
    }

    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, full_name, city, age')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          if (import.meta.env.DEV) {
            logger.error('Error checking onboarding status:', error);
          }
          // Cache as "no onboarding needed" to prevent repeated failed checks
          setOnboardingCache(userId, false);
          return;
        }

        if (!data) {
          setOnboardingCache(userId, false);
          return;
        }

        setOnboardingChecked(true);

        // Show onboarding ONLY if:
        // 1. onboarding_completed is explicitly false, AND
        // 2. User has minimal profile data (likely a new user)
        const hasMinimalData = !data?.full_name && !data?.city && !data?.age;
        const needsOnboarding = data?.onboarding_completed === false && hasMinimalData;

        // CACHE THE RESULT - prevents re-check on dashboard return
        setOnboardingCache(userId, needsOnboarding);

        if (needsOnboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.error('Error in onboarding check:', error);
        }
        // Cache as "no onboarding needed" on error
        setOnboardingCache(userId, false);
      }
    };

    // PERF: Defer DB check until browser is idle (2-5 second timeout)
    // This ensures dashboard renders instantly, onboarding check happens later
    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(checkOnboardingStatus, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(idleId);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(checkOnboardingStatus, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [userId, onboardingChecked]);

  // Restore anonymous drafts after signup/login
  useEffect(() => {
    if (userId) {
      // Check if there's a pending auth action
      const pendingAction = sessionStorage.getItem('pending_auth_action');
      if (pendingAction) {
        try {
          const action = JSON.parse(pendingAction);
          const age = Date.now() - action.timestamp;
          // Only restore if action is recent (within 24 hours)
          if (age < 24 * 60 * 60 * 1000) {
            restoreDrafts();
          }
          sessionStorage.removeItem('pending_auth_action');
        } catch {
          sessionStorage.removeItem('pending_auth_action');
        }
      }
    }
  }, [userId, restoreDrafts]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // SPEED OF LIGHT: Passive Link Observer - prefetches every link that enters viewport
  useEffect(() => {
    const observer = createLinkObserver();
    if (!observer || !scrollContainerRef.current) return;
    
    // Scan for all local router links
    const updateObserver = () => {
      const links = scrollContainerRef.current?.querySelectorAll('a[href^="/"]');
      links?.forEach(link => observer.observe(link));
    };

    updateObserver();

    // Re-scan when content changes (very efficient MutationObserver)
    const mutationObserver = new MutationObserver(updateObserver);
    mutationObserver.observe(scrollContainerRef.current, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  // SCROLL-TO-TOP: Physically instant reset
  // useLayoutEffect fires BEFORE paint, ensuring the user NEVER sees the old scroll position
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [location.pathname]);

  // SWIPE NAVIGATION: Horizontal swipe between bottom-nav pages
  const clientSwipePaths = [
    '/client/dashboard',
    '/client/profile',
    '/client/liked-properties',
    '/messages',
    '/explore/roommates',
  ];
  const ownerSwipePaths = [
    '/owner/dashboard',
    '/owner/profile',
    '/owner/liked-clients',
    '/owner/properties',
    '/messages',
  ];

  // IMMERSIVE MODE: Detect swipe dashboard routes for full-bleed card experience
  // On these routes, TopBar becomes transparent and content extends behind it
  const isImmersiveDashboard = useMemo(() => {
    const path = location.pathname;
    const immersiveRoutes = [
      '/client/dashboard',
      '/owner/dashboard'
    ];
    
    const isMatch = immersiveRoutes.some(route => 
      path === route || 
      path === route + '/' || 
      path.startsWith(route + '/')
    );
    
    return isMatch;
  }, [location.pathname]);

  const { resetFocus } = useFocusMode(6000);

  // 🧘 IMMERSIVE HUD: Combine scroll direction and focus mode for "Sentient Navigation"
  // UI hides when scrolling down or after inactivity, and restores on scroll up or interaction.
  useScrollDirection({
    threshold: 20,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
    resetTrigger: location.pathname
  });

  // Reset nav visibility on every route change so buttons always appear on new pages
  useEffect(() => {
    resetFocus();
  }, [location.pathname, resetFocus]);

  // Map quick filter category names to database category names
  const _mapCategoryToDatabase = useCallback((category: QuickFilterCategory): string => {
    const mapping: Record<QuickFilterCategory, string> = {
      'motorcycle': 'motorcycle',
      'property': 'property',
      'bicycle': 'bicycle',
      'services': 'worker',  // UI 'services' -> DB 'worker'
    };
    return mapping[category] || category;
  }, []);

  // Get current filter categories from the store
  const categories = useCategories();
  
  // Get the original UI category (before mapping) for display purposes
  const _activeUiCategory = categories.length === 1 ? categories[0] : null;


  // IMMERSIVE MODE: Handled above for swipe navigation dependency


  const isRadioRoute = useMemo(() => location.pathname.includes('/radio'), [location.pathname]);
  const isCameraRoute = useMemo(() => location.pathname.includes('/camera'), [location.pathname]);

  // FULLSCREEN MODE: These routes hide the global TopBar and BottomNav entirely
  // and take over the full screen height with 0 padding.
  const isFullScreenRoute = useMemo(() => {
    // 🚀 SPEED OF LIGHT: Standard scrollable discovery/likes pages MUST NOT be fixed
    const scrollExclusions = ['likes', 'interested', 'liked'];
    if (scrollExclusions.some(path => location.pathname.includes(path))) return false;

    const isRoommatesPageLocal = location.pathname.startsWith('/explore/roommates');
    
    // Admin and helper subpages should also be scrollable (not fixed)
    const isSpecialSubPage = [
      '/client/advertise',
      '/explore/prices',
      '/explore/intel',
      '/explore/tours',
      '/documents',
      '/escrow',
      '/admin/eventos',
      '/about',
      '/contact',
      '/privacy-policy',
      '/terms-of-service',
      '/legal',
      '/agl',
      '/subscription/packages',
      '/notifications',
      '/explore/eventos'
    ].some(path => location.pathname === path || location.pathname === path + '/');

    // Only truly immersive non-scroll pages should be fixed
    return isCameraRoute || isRadioRoute || isRoommatesPageLocal || isSpecialSubPage || modalStore.showMapFullscreen;
  }, [location.pathname, isCameraRoute, isRadioRoute, modalStore.showMapFullscreen]);

  const isZeroScrollDashboard = useMemo(() => {
    const path = location.pathname;
    return path === '/client/dashboard' || path === '/owner/dashboard' || path === '/client/dashboard/' || path === '/owner/dashboard/';
  }, [location.pathname]);

  useSwipeNavigation({
    paths: userRole === 'client' ? clientSwipePaths : userRole === 'owner' ? ownerSwipePaths : [],
    containerSelector: '#dashboard-scroll-container',
    enabled: userRole !== 'admin' && !isImmersiveDashboard && location.pathname !== '/client/liked-properties' && location.pathname !== '/owner/liked-clients',
  });

  return (
    <div className={cn(
      "dashboard-root w-full h-full min-h-0 relative flex flex-col overflow-hidden",
      theme === 'ivanna-style' ? "bg-transparent" : ((isImmersiveDashboard || location.pathname.includes('dashboard')) ? (isDark ? "bg-black" : "bg-white") : "bg-background"),
      theme === 'ivanna-style' ? "ivanna-style" : (isDark ? "dark dark-matte" : "light white-matte")
    )}>

    {/* HUD is now managed globally in AppLayout.tsx to ensure a universal immersive experience */}

      {/* Main Content - Scrollable area with safe area spacing for fixed header/footer */}
      <main
        ref={scrollContainerRef}
        id="dashboard-scroll-container"
        onPointerDown={() => {
          // 🛡️ HUD EMERGENCY RECOVERY: Any touch on content forces UI back
          window.dispatchEvent(new CustomEvent('sentient-ui-recovery'));
        }}
        className={cn(
          "flex-1 w-full h-full min-h-0 relative z-0 touch-pan-y overscroll-y-contain",
           isRadioRoute ? "overflow-visible" 
            : (isZeroScrollDashboard || isImmersiveDashboard) ? "overflow-hidden"
            : "overflow-y-auto overflow-x-hidden",
          "shadow-none",
          theme === 'ivanna-style' ? "bg-transparent" : ((location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/' || isImmersiveDashboard || location.pathname.includes('dashboard')) ? (isDark ? "bg-black" : "bg-white") : "bg-background")
        )}
        style={{
          paddingTop: isFullScreenRoute || isImmersiveDashboard
            ? '0px'
            : 'calc(var(--top-bar-height) + var(--safe-top))',
          paddingBottom: isFullScreenRoute || isZeroScrollDashboard
            ? '0px'
            : 'calc(80px + env(safe-area-inset-bottom, 20px))',
          paddingLeft: 'max(var(--safe-left), 0px)',
          paddingRight: 'max(var(--safe-right), 0px)',
        }}
      >
        <div className="h-full w-full flex flex-1 min-w-0 flex-col">
          {children}
        </div>
      </main>

      {/* ZENITH GLOBAL DIALOGS — Decoupled lifecycle */}
      <GlobalDialogs userRole={userRole} />
    </div>
  )
}
