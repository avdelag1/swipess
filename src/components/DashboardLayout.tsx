import React, { ReactNode, useState, useEffect, useCallback, useMemo, useRef, lazy } from 'react'
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

// New Mobile Navigation Components
import { TopBar } from '@/components/TopBar'
import { BottomNavigation } from '@/components/BottomNavigation'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { RadioMiniPlayer } from '@/components/RadioMiniPlayer'
import { IvanaSkyBackground } from '@/components/IvanaSkyBackground'

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
  const { theme, isDark } = useTheme()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  
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

  const userId = user?.id

  // Track if we've checked cache synchronously on mount
  const cacheCheckedRef = useRef(false);

  // PERFORMANCE FIX: Welcome state with DB-backed persistence
  const { shouldShowWelcome: _shouldShowWelcome, dismissWelcome: _dismissWelcome } = useWelcomeState(userId)

  const queryClient = useQueryClient();

  // PERF: Defer route prefetching until after first paint
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

  // PERF: Onboarding check with sessionStorage caching
  useEffect(() => {
    if (!userId || onboardingChecked) return;

    if (!cacheCheckedRef.current) {
      cacheCheckedRef.current = true;
      const cached = getOnboardingCache(userId);
      if (cached) {
        setOnboardingChecked(true);
        if (cached.needsOnboarding) {
          setShowOnboarding(true);
        }
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

        if (error) {
          setOnboardingCache(userId, false);
          return;
        }

        if (!data) {
          setOnboardingCache(userId, false);
          return;
        }

        setOnboardingChecked(true);
        const hasMinimalData = !data?.full_name && !data?.city && !data?.age;
        const needsOnboarding = data?.onboarding_completed === false && hasMinimalData;
        setOnboardingCache(userId, needsOnboarding);

        if (needsOnboarding) {
          setShowOnboarding(true);
        }
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

  // Restore anonymous drafts after signup/login
  useEffect(() => {
    if (userId) {
      const pendingAction = sessionStorage.getItem('pending_auth_action');
      if (pendingAction) {
        try {
          const action = JSON.parse(pendingAction);
          const age = Date.now() - action.timestamp;
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

  // SPEED OF LIGHT: Passive Link Observer
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

  // SCROLL-TO-TOP: Physically instant reset
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [location.pathname]);

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
  const isImmersiveDashboard = useMemo(() => {
    const path = location.pathname;
    const immersiveRoutes = ['/client/dashboard', '/owner/dashboard'];
    return immersiveRoutes.some(route => path === route || path === route + '/' || path.startsWith(route + '/'));
  }, [location.pathname]);

  const { resetFocus } = useFocusMode(6000);

  // 🧘 IMMERSIVE HUD
  useScrollDirection({
    threshold: 20,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
    resetTrigger: location.pathname
  });

  useEffect(() => {
    resetFocus();
  }, [location.pathname, resetFocus]);

  const categories = useCategories();
  
  const isRadioRoute = useMemo(() => location.pathname.includes('/radio'), [location.pathname]);
  const isCameraRoute = useMemo(() => location.pathname.includes('/camera'), [location.pathname]);

  const isFullScreenRoute = useMemo(() => {
    const scrollExclusions = ['likes', 'interested', 'liked'];
    if (scrollExclusions.some(path => location.pathname.includes(path))) return false;

    const isRoommatesPageLocal = location.pathname.startsWith('/explore/roommates');
    const isSpecialSubPage = [
      '/client/advertise', '/explore/prices', '/explore/intel', '/explore/tours',
      '/documents', '/escrow', '/admin/eventos', '/about', '/contact',
      '/privacy-policy', '/terms-of-service', '/legal', '/agl',
      '/subscription/packages', '/notifications', '/explore/eventos'
    ].some(path => location.pathname === path || location.pathname === path + '/');

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
      (isImmersiveDashboard || location.pathname.includes('dashboard')) ? (isDark ? "bg-black" : "bg-white") : "bg-background",
      isDark ? "dark dark-matte" : "light white-matte"
    )}>

      {/* Main Content */}
      <main
        ref={scrollContainerRef}
        id="dashboard-scroll-container"
        onPointerDown={() => {
          window.dispatchEvent(new CustomEvent('sentient-ui-recovery'));
        }}
        className={cn(
          "flex-1 w-full h-full min-h-0 relative z-0 touch-pan-y overscroll-y-contain",
          isRadioRoute ? "overflow-visible" 
            : (isZeroScrollDashboard || isImmersiveDashboard) ? "overflow-hidden"
            : "overflow-y-auto overflow-x-hidden",
          "shadow-none",
          (location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/' || isImmersiveDashboard || location.pathname.includes('dashboard')) ? (isDark ? "bg-black" : "bg-white") : "bg-background"
        )}
        style={{
          paddingTop: isFullScreenRoute || isImmersiveDashboard ? '0px' : 'calc(var(--top-bar-height) + var(--safe-top))',
          paddingBottom: isFullScreenRoute || isZeroScrollDashboard ? '0px' : 'calc(80px + env(safe-area-inset-bottom, 20px))',
          paddingLeft: 'max(var(--safe-left), 0px)',
          paddingRight: 'max(var(--safe-right), 0px)',
        }}
      >
        <div className="h-full w-full flex flex-1 min-w-0 flex-col">
          {children}
        </div>
      </main>

      {/* ZENITH GLOBAL DIALOGS */}
      <GlobalDialogs userRole={userRole} />
    </div>
  )
}
