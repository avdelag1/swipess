import React, { ReactNode, useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense, useLayoutEffect } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useAnonymousDrafts } from "@/hooks/useAnonymousDrafts"
import { supabase } from '@/integrations/supabase/client'
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from "react-router-dom";
import { useResponsiveContext } from '@/contexts/ResponsiveContext'
import { prefetchRoleRoutes, createLinkObserver } from '@/utils/routePrefetcher'
// useLayoutEffect imported above with the main React import
import useAppTheme from '@/hooks/useAppTheme'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator'

// SPEED OF LIGHT HOOKS
import { useWelcomeState } from "@/hooks/useWelcomeState"
import { lazyWithRetry } from '@/utils/lazyRetry';
const GlobalDialogs = lazyWithRetry(() => import('./GlobalDialogs').then(m => ({ default: m.GlobalDialogs })));
import { useModalStore } from '@/state/modalStore'
import { useFocusMode } from '@/hooks/useFocusMode'
import { useScrollDirection } from '@/hooks/useScrollDirection'

// =============================================================================
// PERFORMANCE FIX: SessionStorage caching for dashboard checks
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

interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'client' | 'owner' | 'admin'
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { theme, isDark } = useAppTheme()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const modalStore = useModalStore()
  const { navigate } = useAppNavigate();
  const location = useLocation()
  const { user } = useAuth()
  const { restoreDrafts } = useAnonymousDrafts()
  const responsive = useResponsiveContext()
  const userId = user?.id
  const cacheCheckedRef = useRef(false);

  // 🛡️ HUD MASTER RECOVERY: Ensure UI is visible on mount and every navigation
  useEffect(() => {
    const recoveryEvent = new CustomEvent('swipess-ui-recovery');
    window.dispatchEvent(recoveryEvent);
    
    const safetyCheck = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('swipess-ui-recovery'));
    }, 1500);

    return () => clearTimeout(safetyCheck);
  }, [location.pathname]);

  // NEXT-GEN DESIGN: Mouse tracking for liquid glass effects has been moved
  // to AtmosphericLayer.tsx natively to prevent global CSS reflows/layout thrashing.

  const { shouldShowWelcome: _shouldShowWelcome, dismissWelcome: _dismissWelcome } = useWelcomeState(userId)
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (!userId || onboardingChecked) return;

    if (!cacheCheckedRef.current) {
      cacheCheckedRef.current = true;
      const cached = getOnboardingCache(userId);
      if (cached) {
        setOnboardingChecked(true);
        if (cached.needsOnboarding) setShowOnboarding(true);
        return;
      }
    }

    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, full_name, city, age')
          .eq('user_id', userId)
          .maybeSingle();

        if (error || !data) {
          setOnboardingCache(userId, false);
          return;
        }

        setOnboardingChecked(true);
        const hasMinimalData = !data?.full_name && !data?.city && !data?.age;
        const needsOnboarding = data?.onboarding_completed === false && hasMinimalData;
        setOnboardingCache(userId, needsOnboarding);

        if (needsOnboarding) setShowOnboarding(true);
      } catch (error) {
        setOnboardingCache(userId, false);
      }
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(checkOnboardingStatus, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(idleId);
    } else {
      const timeoutId = setTimeout(checkOnboardingStatus, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [userId, onboardingChecked]);

  useEffect(() => {
    if (userId) {
      const pendingAction = sessionStorage.getItem('pending_auth_action');
      if (pendingAction) {
        try {
          const action = JSON.parse(pendingAction);
          if (Date.now() - action.timestamp < 24 * 60 * 60 * 1000) {
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

  // SINGLE SOURCE OF TRUTH: only the two swipe deck routes are locked.
  // Every other route scrolls inside this container.
  const isSwipeDeck = useMemo(() => {
    const path = location.pathname;
    return path === '/client/dashboard' || path === '/client/dashboard/' ||
           path === '/owner/dashboard'  || path === '/owner/dashboard/';
  }, [location.pathname]);

  const isRadioRoute = useMemo(() => location.pathname.includes('/radio'), [location.pathname]);
  const isCameraRoute = useMemo(() => location.pathname.includes('/camera'), [location.pathname]);

  // Explicit allow-list of routes that own their own scroll surface. Every
  // other route uses the dashboard <main> as the single scroll container,
  // which fixes the "page won't scroll" bug caused by nested scrollers.
  const isFullScreenRoute = useMemo(() => {
    const path = location.pathname.replace(/\/$/, '');
    if (isRadioRoute || isCameraRoute) return true;
    // Snap-feed: events main feed only (not /likes or /:id detail).
    if (path === '/explore/events') return true;
    // Roommate swipe deck only (not /likes sub-pages).
    if (path === '/explore/roommates') return true;
    return false;
  }, [location.pathname, isCameraRoute, isRadioRoute]);

  const isZeroScrollDashboard = useMemo(() => {
    const path = location.pathname;
    return path === '/client/dashboard' || path === '/owner/dashboard' || path === '/client/dashboard/' || path === '/owner/dashboard/';
  }, [location.pathname]);

  // HOOKS THAT DEPEND ON MEMOS
  // Pull-to-refresh listens on `scrollContainerRef` (#dashboard-scroll-
  // container), but on non-dashboard pages the real scroll happens
  // inside AnimatedOutlet's `#page-scroll-container`. Leaving PTR on
  // would mean the outer container's `scrollTop` is always 0 → every
  // downward touch starts a pull, eventually invalidating queries and
  // re-rendering the page (which looked like a "snap-back" to the
  // user). Only enable PTR on the actual dashboard.
  const isDashboardPage = location.pathname.startsWith('/client/dashboard') ||
    location.pathname.startsWith('/owner/dashboard');
  const ptrDisabled = isSwipeDeck || !isDashboardPage;
  const { isRefreshing, pullDistance, triggered } = usePullToRefresh({
    containerRef: scrollContainerRef,
    disabled: ptrDisabled,
  });

  const { resetFocus } = useFocusMode(6000);

  // 🧘 HUD VISIBILITY LOGIC
  // We no longer call useScrollDirection here because it triggers full re-renders
  // of the entire dashboard shell on every scroll frame. Instead, individual
  // HUD components (TopBar, BottomNavigation) use SwipessHud which handles
  // its own optimized scroll tracking via its own useScrollDirection instance.

  // EFFECTS
  useEffect(() => {
    const observer = createLinkObserver();
    if (!observer || !scrollContainerRef.current) return;
    
    const updateObserver = () => {
      const links = scrollContainerRef.current?.querySelectorAll('a[href^="/"]');
      links?.forEach(link => observer.observe(link));
    };

    updateObserver();
    const mutationObserver = new MutationObserver(updateObserver);
    mutationObserver.observe(scrollContainerRef.current, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  // 🚀 SMART SCROLL RESTORATION
  // Only scroll to top when navigating to a NEW page, not when staying on the same route.
  // This prevents the "bounce back" issue on scrollable pages like Profile.
  const prevPathRef = useRef(location.pathname);
  useLayoutEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTo({ top: 0, behavior: 'auto' });
      }
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  useLayoutEffect(() => {
    document.body.classList.toggle('swipe-deck-active', isSwipeDeck);
    return () => document.body.classList.remove('swipe-deck-active');
  }, [isSwipeDeck]);

  useEffect(() => {
    resetFocus();
  }, [location.pathname, resetFocus]);

  // useSwipeNavigation removed to prevent horizontal scrolling interference with listing details

  return (
    <div className={cn(
      "dashboard-root w-full h-full flex flex-col relative overflow-hidden",
      isDark ? "dark" : "light",
      isSwipeDeck && "bg-swipe-frame"
    )}>
      {!isSwipeDeck && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          triggered={triggered}
        />
      )}

      <main
        ref={scrollContainerRef}
        id="dashboard-scroll-container"
        className={cn(
          "flex-1 flex flex-col relative w-full min-h-0",
          (isSwipeDeck || isFullScreenRoute) ? "overflow-hidden touch-none" : "overflow-y-auto",
          isSwipeDeck && "bg-swipe-frame"
        )}
        style={{
          WebkitOverflowScrolling: (isSwipeDeck || isFullScreenRoute) ? 'auto' : 'touch',
          overscrollBehavior: (isSwipeDeck || isFullScreenRoute) ? 'none' : undefined,
          touchAction: (isSwipeDeck || isFullScreenRoute) ? 'none' : undefined,
        }}
      >
        <div className={cn(
          "w-full flex flex-col",
          (isSwipeDeck || isFullScreenRoute)
            ? "flex-1 min-h-0 overflow-hidden"
            : "flex-none pt-[var(--top-bar-height)] pb-[var(--bottom-nav-height)]"
        )}
        style={(!isSwipeDeck && !isFullScreenRoute) ? { minHeight: '100%' } : undefined}
        >
          {children}
        </div>
      </main>

      {/* SWIPESS GLOBAL DIALOGS */}
      <Suspense fallback={null}>
        <GlobalDialogs userRole={userRole} />
      </Suspense>

    </div>
  )
}
