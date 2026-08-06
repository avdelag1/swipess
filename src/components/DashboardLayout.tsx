import React, { ReactNode, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useAnonymousDrafts } from "@/hooks/useAnonymousDrafts"
// supabase import removed because it was unused
import { useLocation } from "react-router-dom";
import { createLinkObserver, prefetchRoleRoutes } from '@/utils/routePrefetcher'
// useLayoutEffect imported above with the main React import
import useAppTheme from '@/hooks/useAppTheme'
import { cn } from '@/lib/utils'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator'
import { logger } from '@/utils/prodLogger'

// SPEED OF LIGHT HOOKS
import { useFocusMode } from '@/hooks/useFocusMode'
import { useOnboardingStore } from '@/state/onboardingStore'
import { useModalStore } from '@/state/modalStore'
import { useFilterStore } from '@/state/filterStore'



interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'client' | 'owner' | 'admin'
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { isDark } = useAppTheme()
  
  
  const location = useLocation()
  const { user } = useAuth()
  const { restoreDrafts } = useAnonymousDrafts()
  
  const userId = user?.id

  // ONBOARDING
  const { hasSeenOnboarding, markOnboardingSeen, setOnboardingActive } = useOnboardingStore()
  const { openAIProfile } = useModalStore()

  useEffect(() => {
    if (userRole === 'client' || userRole === 'owner') {
      if (!hasSeenOnboarding) {
        markOnboardingSeen()
        setOnboardingActive(true)
        openAIProfile(userRole)
      }
    }
  }, [hasSeenOnboarding, userRole, openAIProfile, markOnboardingSeen, setOnboardingActive])

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
  const activeCategory = useFilterStore((s) => s.activeCategory);
  const isSwipeDeck = useMemo(() => {
    const path = location.pathname;
    const isDashRoute = path === '/client/dashboard' || path === '/client/dashboard/' ||
           path === '/owner/dashboard'  || path === '/owner/dashboard/';
    // Only lock touch when actually swiping cards, NOT on the bento quick filter page
    return isDashRoute && !!activeCategory;
  }, [location.pathname, activeCategory]);

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
    // Premium packages owns its own scroll surface (portaled fullscreen).
    if (path.startsWith('/subscription')) return true;
    return false;
  }, [location.pathname, isCameraRoute, isRadioRoute]);

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

  // 🚀 ENHANCED SCROLL RESTORATION WITH LOCALSTORAGE PERSISTENCE
  const scrollPositions = useRef<Record<string, number>>({});
  const prevPathRef = useRef(location.pathname);
  const SCROLL_STORAGE_KEY = 'swipess_scroll_positions';

  // Load scroll positions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
      if (stored) {
        scrollPositions.current = JSON.parse(stored);
      }
    } catch (e) {
      logger.warn('Failed to load scroll positions:', e);
    }
  }, []);

  // Save scroll position whenever it changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      scrollPositions.current[location.pathname] = el.scrollTop;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      try {
        localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollPositions.current));
      } catch {
        // Storage quota exceeded, just use memory
      }
    };
  }, [location.pathname]);

  // Restore scroll position when navigating
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Save current scroll position before navigating
    scrollPositions.current[prevPathRef.current] = el.scrollTop;

    // Restore scroll position for the new path
    const savedPos = scrollPositions.current[location.pathname] ?? 0;
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      el.scrollTop = savedPos;
      prevPathRef.current = location.pathname;
    });
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
            "dashboard-root w-full flex-1 min-h-0 flex flex-col relative overflow-hidden",
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
          "w-full",
          (isSwipeDeck || isFullScreenRoute)
            ? "flex flex-col flex-1 min-h-0 overflow-hidden"
            : "block min-h-full pb-[var(--bottom-nav-height)]"
        )}>
          {children}
        </div>
      </main>

    </div>
  );
}
