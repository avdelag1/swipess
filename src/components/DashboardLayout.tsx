import React, { ReactNode, useState, useEffect, useCallback, useMemo, lazy, useRef } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useAnonymousDrafts } from "@/hooks/useAnonymousDrafts"
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/components/ui/sonner'
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from "react-router-dom";
import { useResponsiveContext } from '@/contexts/ResponsiveContext'
import { prefetchRoleRoutes } from '@/utils/routePrefetcher'
import { logger } from '@/utils/prodLogger'
import { useTheme } from '@/hooks/useTheme'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories } from '@/state/filterStore'
import { QuickFilterCategory } from '@/types/filters'
import { warmDiscoveryCache } from '@/utils/performance'


// New Mobile Navigation Components
import { TopBar } from '@/components/TopBar'
import { SwipessLogo } from '@/components/SwipessLogo'
import { BottomNavigation } from '@/components/BottomNavigation'

// SPEED OF LIGHT HOOKS
import { useWelcomeState } from "@/hooks/useWelcomeState"
import { LoadingBar } from './ui/LoadingBar';
import { GlobalDialogs } from './GlobalDialogs'
import { useModalStore } from '@/state/modalStore'
import { SmartSuspense } from './SmartSuspense';

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

function clearOnboardingCache(): void {
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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  
  const modalStore = useModalStore()

  const { navigate } = useAppNavigate();
  const location = useLocation()
  const { user } = useAuth()
  const { restoreDrafts } = useAnonymousDrafts()
  const responsive = useResponsiveContext()

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
  const { shouldShowWelcome, dismissWelcome } = useWelcomeState(userId)

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

  // SCROLL-TO-TOP: Reset after exit animation completes (exit is 160ms, reset at 180ms)
  useEffect(() => {
    const id = setTimeout(() => {
      const el = document.getElementById('dashboard-scroll-container');
      el?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, 180);
    return () => clearTimeout(id);
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
    // Core routes that should go full-bleed behind the header
    // Only the discovery dashboard remains immersive for the 'hero' card effect
    const immersiveRoutes = [
      '/client/dashboard',
      '/owner/dashboard',
    ];

    const isMatch = immersiveRoutes.some(route => path === route || path === route + '/' || path.startsWith(route + '/')) ||
      path.includes('discovery') ||
      path.includes('view-client');
    
    return isMatch;
  }, [location.pathname]);

  useSwipeNavigation({
    paths: userRole === 'client' ? clientSwipePaths : userRole === 'owner' ? ownerSwipePaths : [],
    containerSelector: '#dashboard-scroll-container',
    enabled: userRole !== 'admin' && !isImmersiveDashboard,
  });

  // PERFORMANCE FIX: Welcome check now handled by useWelcomeState hook
  // This ensures welcome shows only on first signup, never on subsequent sign-ins
  // (survives localStorage clears from external preview URLs)


  const handleMessageClick = useCallback(() => {
    modalStore.openSubscription(userRole === 'owner' ? 'Unlock messaging to connect with clients!' : 'Unlock messaging to connect with property owners!')
  }, [userRole, modalStore])

  const handleFilterClick = useCallback(() => {
    if (userRole === 'owner') {
      navigate('/owner/filters-explore')
    } else {
      modalStore.setModal('showFilters', true)
    }
  }, [userRole, navigate, modalStore])

  const handleAddListingClick = useCallback(() => {
    modalStore.setModal('showCategoryDialog', true)
  }, [modalStore])

  const handleListingsClick = useCallback(() => {
    navigate('/owner/properties');
  }, [navigate])

  const handleMessageActivationsClick = useCallback(() => {
    modalStore.setModal('showMessageActivations', true);
  }, [modalStore]);

  // Quick filters are now handled directly by QuickFilterDropdown dispatching to the store
  // No more local handler needed - store is single source of truth

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
  const isImmersiveFeed = (location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/') || isRoommatesPage;

  // IMMERSIVE MODE: Handled above for swipe navigation dependency


  // FULLSCREEN MODE: These routes hide the global TopBar and BottomNav entirely
  // and take over the full screen height with 0 padding.
  const isFullScreenRoute = useMemo(() => {
    // Only Camera and Radio remain fully fullscreen (hiding everything)
    // Eventos and Roommates now show TopBar/BottomNav per user request
    // HOWEVER, the Detail page for Eventos should be fullscreen to avoid "double access" X/Back issues
    const isEventoDetail = location.pathname.startsWith('/explore/eventos/') && 
                          location.pathname !== '/explore/eventos' && 
                          location.pathname !== '/explore/eventos/' &&
                          location.pathname !== '/explore/eventos/likes'; // Likes should have the regular header padding
    
    // User wants header gone from Events to avoid interference
    const isEventsMain = (location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/');

    // Rare sub-pages that manage their own navigation/back behavior
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
      '/notifications'
    ].some(path => location.pathname === path || location.pathname === path + '/');

    return isCameraRoute || isRadioRoute || 
           isEventoDetail || isEventsMain || isRoommatesPage || isSpecialSubPage;
  }, [isCameraRoute, isRadioRoute, location.pathname, isRoommatesPage]);

  // Dynamic page titles disabled per user request: "Remove any title or description on the top header"
  // Icons and context already convey location; clear header improves tap-to-dashboard UX.
  const pageTitle = useMemo(() => {
    return '';
  }, []);

  // Calculate responsive layout values
  const topBarHeight = responsive.isMobile ? 52 : 56;
  const bottomNavHeight = responsive.isMobile ? 68 : 72;

  return (
    <div className={cn(
      "app-root min-h-screen min-h-dvh overflow-hidden relative w-full max-w-[100vw]",
      isDark ? "dark dark-matte" : "light white-matte"
    )}>

      {/* Speed of Light Global Loading Bar */}
      <LoadingBar />

      {/* Top Bar - Fixed with safe-area-top. Hidden on camera, radio and immersive feeds for fullscreen UX */}
      {/* Hides smoothly on scroll down and reappears on scroll up for all routes */}
      {!isFullScreenRoute && (
        <TopBar
          onNotificationsClick={() => {}} // Now handled internally by TopBar navigating to /notifications
          onMessageActivationsClick={handleMessageActivationsClick}
          showFilters={isOnDiscoveryPage}
          userRole={userRole}
          transparent={isImmersiveDashboard || isImmersiveFeed}
          hideOnScroll={true}
          title={pageTitle}
          showBack={!isOnDiscoveryPage}
        />
      )}

      {/* Main Content - Scrollable area with safe area spacing for fixed header/footer */}
      {/* On camera, radio route or immersive dashboard: content extends behind TopBar for full-bleed experience */}
      <main
        id="dashboard-scroll-container"
        className={cn(
          "absolute inset-0 overflow-x-hidden scroll-area-momentum scrollbar-hide shadow-none",
          isFullScreenRoute ? "overflow-y-hidden" : "overflow-y-auto",
          // Events feed is always dark/immersive — match its bg to prevent white flash on transition
          (location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/') ? "bg-black" : "bg-background",
          "w-full max-w-[100vw] box-border z-0 transform-gpu touch-pan-y"
        )}
        style={{
          paddingTop: (isFullScreenRoute || isImmersiveDashboard || isImmersiveFeed)
            ? '0px'
            : `calc(${topBarHeight}px + var(--safe-top))`,
          paddingBottom: (isFullScreenRoute) ? '0px' : `calc(${bottomNavHeight}px + var(--safe-bottom))`,
          paddingLeft: 'max(var(--safe-left), 0px)',
          paddingRight: 'max(var(--safe-right), 0px)',
        }}
      >
        {/* Global Branding Watermark - Vibrant "Elite" feel */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[-1] opacity-[0.1] select-none">
          <SwipessLogo size="xl" className="w-[80%] max-w-4xl" />
        </div>

        {/* PERF FIX: Removed motion.div key={location.pathname} wrapper.
            AnimatedOutlet already handles page transitions with key={location.key}.
            The double wrapper was causing unnecessary unmount/remount cycles. */}
        <div className="min-h-full w-full flex flex-col">
          {enhancedChildren}
        </div>
      </main>

      {/* Bottom Navigation - Fixed with safe-area-bottom. Hidden on camera, radio and all immersive feeds */}
      {!isCameraRoute && !isRadioRoute && !isImmersiveFeed && (
        <BottomNavigation
          userRole={userRole}
          onFilterClick={() => modalStore.setModal('showFilters', true)}
          onAddListingClick={() => modalStore.setModal('showCategoryDialog', true)}
          onListingsClick={handleListingsClick}
          onAISearchClick={() => {
            if (userRole === 'owner') {
              navigate('/owner/listings/new-ai');
            } else {
              modalStore.setModal('isAISearchOpen', true);
            }
          }}
        />
      )}

      {/* ZENITH GLOBAL DIALOGS — Decoupled lifecycle */}
      <GlobalDialogs userRole={userRole} />
    </div>
  )
}
