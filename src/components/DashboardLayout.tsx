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
  const isDark = theme === 'dark' || theme === 'cheers'
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
    // Core routes that should go full-bleed behind the header ONLY for hero effects.
    // Standard dashboards should now have padding to prevent button overlap.
    const immersiveRoutes = [
      '/client/liked-properties',
      '/owner/interested-clients',
      '/owner/liked-clients',
      '/client/advertise'
    ];

    const isMatch = immersiveRoutes.some(route => path === route || path === route + '/' || path.startsWith(route + '/')) ||
      path.includes('discovery') ||
      path.includes('view-client') ||
      path.includes('/listing/');
    
    return isMatch;
  }, [location.pathname]);

  const { isFocused, resetFocus } = useFocusMode(6000);

  // 🧘 IMMERSIVE HUD: Combine scroll direction and focus mode for "Sentient Navigation"
  // UI hides when scrolling down or after inactivity, and restores on scroll up or interaction.
  const { isVisible: isScrollVisible } = useScrollDirection({
    threshold: 20,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
    resetTrigger: location.pathname
  });

  const showHUD = !isFocused && isScrollVisible;

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


  // Check if we're on a discovery page where filters should be shown
  // MUST be declared BEFORE enhancedChildren useMemo that references it
  const isOnDiscoveryPage = (userRole === 'client' && location.pathname === '/client/dashboard') ||
    (userRole === 'owner' && location.pathname === '/owner/dashboard');

  // PERF FIX: Do NOT clone children with props — route elements (MyHub, ClientProfile, etc.)
  // get their data from hooks/stores directly, not from cloneElement props.
  // The old cloneElement pattern caused cascading re-renders (React #185) because
  // combinedFilters changed identity on every filter store update, triggering
  // AnimatedOutlet to re-clone the outlet element with new props on every render.
  const enhancedChildren = children;

  // PERF FIX: Detect camera and radio routes to hide TopBar/BottomNav (fullscreen UX)
  // Camera and radio routes are now INSIDE layout to prevent dashboard remount on navigate back
  // IMMERSIVE FULLSCREEN: Routes that take over the entire screen (e.g. Camera, Radio, Stories-style feeds)
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');
  const isRoommatesPage = location.pathname.startsWith('/explore/roommates');
  const isImmersiveFeed = isRoommatesPage || location.pathname.startsWith('/explore/eventos');

  // IMMERSIVE MODE: Handled above for swipe navigation dependency


  // FULLSCREEN MODE: These routes hide the global TopBar and BottomNav entirely
  // and take over the full screen height with 0 padding.
  const isFullScreenRoute = useMemo(() => {
    // 🚀 SPEED OF LIGHT: Standard scrollable discovery/likes pages MUST NOT be fixed
    const scrollExclusions = ['likes', 'interested', 'liked'];
    if (scrollExclusions.some(path => location.pathname.includes(path))) return false;

    const isCameraRoute = location.pathname.includes('/camera');
    const isRadioRoute = location.pathname.includes('/radio');
    const isRoommatesPage = location.pathname.startsWith('/explore/roommates');
    
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

    const hideHUDRoutes = ['/explore/eventos', '/explore/roommates'];
    
    // Only truly immersive non-scroll pages should be fixed
    return isCameraRoute || isRadioRoute || isRoommatesPage || isSpecialSubPage;
  }, [location.pathname]);

  const isZeroScrollDashboard = useMemo(() => {
    const path = location.pathname;
    return path === '/client/dashboard' || path === '/owner/dashboard' || path === '/client/dashboard/' || path === '/owner/dashboard/';
  }, [location.pathname]);

  const handleMessageActivationsClick = useCallback(() => {
    navigate('/subscription/packages');
  }, [navigate]);

  const handleListingsClick = useCallback(() => {
    if (userRole === 'owner') {
      navigate('/owner/properties');
    } else {
      navigate('/client/liked-properties');
    }
  }, [navigate, userRole]);

  // Dynamic page titles disabled per user request: "Remove any title or description on the top header"
  // Icons and context already convey location; clear header improves tap-to-dashboard UX.
  const pageTitle = useMemo(() => {
    return '';
  }, []);

  // Calculate responsive layout values
  const topBarHeight = responsive.isMobile ? 52 : 56;
  const bottomNavHeight = responsive.isMobile ? 68 : 72;

  useSwipeNavigation({
    paths: userRole === 'client' ? clientSwipePaths : userRole === 'owner' ? ownerSwipePaths : [],
    containerSelector: '#dashboard-scroll-container',
    enabled: userRole !== 'admin' && !isImmersiveDashboard && location.pathname !== '/client/liked-properties' && location.pathname !== '/owner/liked-clients',
  });

  const isIvanna = theme === 'ivanna-style';

  return (
    <div className={cn(
      "dashboard-root w-full h-full min-h-0 relative flex flex-col overflow-hidden",
      isIvanna ? "bg-transparent" : "bg-background",
      isDark ? "dark dark-matte" : "light white-matte"
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
          "flex-1 w-full min-h-0 relative z-0 touch-pan-y overscroll-y-contain",
          isIvanna ? "bg-transparent" : "bg-background",
           isRadioRoute ? "overflow-visible" 
            : isZeroScrollDashboard ? "overflow-hidden"
            : "overflow-y-auto overflow-x-hidden",
          "shadow-none",
          (location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/') ? "bg-black" : (isIvanna ? "bg-transparent" : "bg-background")
        )}
        style={{
          paddingTop: isFullScreenRoute || isImmersiveDashboard
            ? '0px'
            : 'calc(var(--top-bar-height) + var(--safe-top))',
          paddingBottom: 0,
          paddingLeft: 'max(var(--safe-left), 0px)',
          paddingRight: 'max(var(--safe-right), 0px)',
        }}
      >
        <div className="h-full w-full flex flex-1 min-w-0 flex-col">
          {enhancedChildren}
        </div>
      </main>

      {/* ZENITH GLOBAL DIALOGS — Decoupled lifecycle */}
      <GlobalDialogs userRole={userRole} />
    </div>
  )
}
