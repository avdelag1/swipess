import { Suspense, lazy, useMemo, useEffect, useRef } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';

import { useLocation } from 'react-router-dom';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useModalStore } from '@/state/modalStore';
import { useInstantReactivity } from '@/hooks/useInstantReactivity';
import { cn } from '@/lib/utils';

const TopBar = lazyWithRetry(() => import('./TopBar').then(m => ({ default: m.TopBar })));
const BottomNavigation = lazyWithRetry(() => import('./BottomNavigation').then(m => ({ default: m.BottomNavigation })));
const RadioMiniPlayer = lazyWithRetry(() => import('./RadioMiniPlayer').then(m => ({ default: m.RadioMiniPlayer })));
const VoiceConciergeButton = lazyWithRetry(() => import('./VoiceConciergeButton').then(m => ({ default: m.VoiceConciergeButton })));
const SwipessHud = lazyWithRetry(() => import('./SwipessHud').then(m => ({ default: m.SwipessHud })));
const VapIdCardModal = lazyWithRetry(() => import('./VapIdCardModal').then(m => ({ default: m.VapIdCardModal })));
const GlobalDialogs = lazyWithRetry(() => import('./GlobalDialogs').then(m => ({ default: m.GlobalDialogs })));
import { ChromeSummonZones } from './swipe/ChromeSummonZones';
import { useChromeReveal } from '@/hooks/useChromeReveal';


const NotificationSystem = lazy(() =>
  import('@/components/NotificationSystem').then(m => ({ default: m.NotificationSystem }))
);
const DiscoveryFilters = lazy(() =>
  import('@/components/filters/DiscoveryFilters').then(m => ({ default: m.DiscoveryFilters }))
);
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useAppTheme();
  const location = useLocation();
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const modalStore = useModalStore();
  const { showAIChat, showAIListing } = modalStore;
  const { activeMode } = useActiveMode();
  const { isChromeVisible } = useChromeReveal();
  
  const isSwipeDashboard = useMemo(() => {
    const path = location.pathname;
    return path.startsWith('/client/dashboard') || path.startsWith('/owner/dashboard');
  }, [location.pathname]);

  // Determine whether we're in the "swipe deck" phase (cards on screen) vs
  // the "picking phase" (quick-filter poker cards visible).
  const { selectedCategoriesCount, ownerPhase } = useFilterStore(
    useShallow(s => ({
      selectedCategoriesCount: s.categories.length,
      ownerPhase: s.ownerPhase,
    }))
  );
  const isClientDash = location.pathname.startsWith('/client/dashboard');
  const isOwnerDash = location.pathname.startsWith('/owner/dashboard');
  const swipeDeckActive =
    (isClientDash && selectedCategoriesCount > 0) ||
    (isOwnerDash && ownerPhase === 'swipe');
  // Picking phase = on dashboard but no swipe deck yet → chrome always visible
  const inPickingPhase = isSwipeDashboard && !swipeDeckActive;

  // While inside the swipe deck, chrome auto-hides after 5s and is summoned
  // by tapping the top edge or bottom-center strip (revealMode).
  // Everywhere else it's always visible.
  const useRevealMode = swipeDeckActive && !showAIChat;
  const hideFloatingForSwipe = useRevealMode && !isChromeVisible;

  const { isRefreshing, pullDistance, triggered } = usePullToRefresh({
    disabled: isSwipeDashboard
  });

  const userRole = useMemo<'client' | 'owner' | 'admin'>(() => {
    if (user?.user_metadata?.role === 'admin') return 'admin';
    if (location.pathname.startsWith('/owner/')) return 'owner';
    if (location.pathname.startsWith('/client/')) return 'client';
    return activeMode;
  }, [activeMode, location.pathname, user?.user_metadata?.role]);

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); 

  const { t } = useTranslation();

  // In-app audio fully disabled — sounds are reserved for the public
  // landing-page cosmos background only (LandingBackgroundEffects.tsx).

  // Filters removed from here since they are unused



  // Fire swipess-ready exactly once after the layout first mounts.
  // The 700ms delay lets Suspense resolve route chunks and fire the first
  // render pass before we dismiss the splash — so the user sees a full page.
  const splashDismissedRef = useRef(false);
  useEffect(() => {
    if (splashDismissedRef.current) return;
    splashDismissedRef.current = true;
    const id = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('swipess-ready'));
      window.dispatchEvent(new CustomEvent('app-rendered'));
    }, 700);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const recover = () => window.dispatchEvent(new CustomEvent('swipess-ui-recovery'));
    recover();
    const frame = requestAnimationFrame(recover);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');
  const isAuthRoute = location.pathname === '/' || location.pathname === '/reset-password';
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');

  // AppLayout is ALWAYS a fixed shell — it never scrolls itself.
  // DashboardLayout's #dashboard-scroll-container owns all authenticated-page scrolling.
  // Public standalone pages (outside DashboardLayout) scroll via the main container below.
  const isInsideDashboard = useMemo(() => {
    const path = location.pathname;
    // These routes go through PersistentDashboardLayout → DashboardLayout
    // They must NOT scroll at AppLayout level — DashboardLayout handles it
    const publicRoutes = ['/', '/reset-password', '/legal', '/about', '/faq/', '/listing/', '/profile/', '/vap-validate/', '/payment/'];
    const isPublic = publicRoutes.some(r => path === r || path.startsWith(r));
    return !isPublic;
  }, [location.pathname]);



  const isFullScreen = useMemo(() => {
    const path = location.pathname;
    const isRadio = path.startsWith('/radio');
    const isCamera = path.startsWith('/camera');
    const isRoommates = path.startsWith('/explore/roommates');
    return isCamera || isRadio || showAIChat || isSwipeDashboard || isRoommates;
  }, [location.pathname, showAIChat, isSwipeDashboard]);

  const showAppChrome = !isAuthRoute && !isRadioRoute && !isCameraRoute && !showAIChat && (!isPublicPreview || !!user);

  const handleFilterClick = () => {
    const role = userRole === 'admin' ? 'admin' : activeMode;
    navigate(`/${role}/filters`);
  };

  const handleListingsClick = () => {
    if (userRole === 'owner') navigate('/owner/properties');
    else navigate('/client/liked-properties');
  };

  const handleMessageActivationsClick = () => navigate('/subscription/packages');

  return (
    <div className={cn(
      "w-full h-[100dvh] flex flex-col relative selection:bg-brand-primary/30 overflow-hidden", 
      "bg-background",
      theme === 'Swipess-style' && "Swipess-style"
    )}>
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>
  
      {showAppChrome && (
        <Suspense fallback={null}>
          <SwipessHud side="top" className="fixed top-0 left-0 right-0 z-[10005]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={false} revealMode={useRevealMode}>
            <TopBar
              userRole={userRole}
              onMessageActivationsClick={handleMessageActivationsClick}
              onFilterClick={handleFilterClick}
              transparent={location.pathname === '/client/dashboard' || location.pathname === '/owner/dashboard'}
              showBack={!location.pathname.match(/^\/(client|owner|admin)\/dashboard\/?$/)}
              onCenterTap={
                !location.pathname.match(/^\/(client|owner|admin)\/dashboard\/?$/)
                  ? () => navigate(`/${activeMode}/dashboard`)
                  : undefined
              }
            />
          </SwipessHud>
        </Suspense>
      )}

      {/* SHELL CONTAINER: Always fixed-height. DashboardLayout handles scrolling inside. */}
      <main
        id="main-content"
        className={cn(
          "w-full flex-1 relative z-0 flex flex-col",
          // Push content down below the fixed header
          !isAuthRoute && !isFullScreen && !isRadioRoute && !isCameraRoute && !isInsideDashboard && "pt-[var(--top-bar-height)]",
          // Dashboard pages: overflow-hidden, DashboardLayout scrolls internally
          // Public/standalone pages: overflow-y-auto, scroll at this level
          (isInsideDashboard || isFullScreen) ? "overflow-hidden" : "overflow-y-auto scroll-area-momentum pb-[var(--bottom-nav-height)]"
        )}
      >
        <div className="w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>





      {showAppChrome && (
        <Suspense fallback={null}>
          <SwipessHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[10005]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={false} revealMode={useRevealMode}>
            <BottomNavigation
              userRole={userRole}
              onFilterClick={handleFilterClick}
              onListingsClick={handleListingsClick}
            />
          </SwipessHud>
        </Suspense>
      )}

      {/* Tap zones to summon chrome on swipe dashboards */}
      {showAppChrome && useRevealMode && <ChromeSummonZones />}

      {/* 📻 CONNECTED RADIO: Floating player bubble - Hidden on radio/full-screen routes */}
      {showAppChrome && !isFullScreen && !hideFloatingForSwipe && (
        <Suspense fallback={null}>
          <RadioMiniPlayer />
        </Suspense>
      )}
      
      {/* 🤖 VOICE CONCIERGE: Left-side floating assistant */}
      {showAppChrome && !isFullScreen && !hideFloatingForSwipe && (
        <Suspense fallback={null}>
          <VoiceConciergeButton />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <VapIdCardModal
          isOpen={modalStore.showVapId}
          onClose={() => modalStore.setModal('showVapId', false)}
        />
        <GlobalDialogs userRole={userRole} />
      </Suspense>
    </div>
  );
}


