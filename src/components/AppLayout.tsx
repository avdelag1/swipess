import { Suspense, lazy, useMemo, useEffect, useState, useRef, useLayoutEffect } from 'react';
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

const TopBar = lazy(() => import('./TopBar').then(m => ({ default: m.TopBar })));
const BottomNavigation = lazy(() => import('./BottomNavigation').then(m => ({ default: m.BottomNavigation })));
const RadioMiniPlayer = lazy(() => import('./RadioMiniPlayer').then(m => ({ default: m.RadioMiniPlayer })));
const VoiceConciergeButton = lazy(() => import('./VoiceConciergeButton').then(m => ({ default: m.VoiceConciergeButton })));
const SwipessHud = lazy(() => import('./SwipessHud').then(m => ({ default: m.SwipessHud })));
const VapIdCardModal = lazy(() => import('./VapIdCardModal').then(m => ({ default: m.VapIdCardModal })));
const GlobalDialogs = lazy(() => import('./GlobalDialogs').then(m => ({ default: m.GlobalDialogs })));

import { uiSounds } from '@/utils/uiSounds'; // SWIPESS AUDIO ENGINE

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
  
  const isSwipeDashboard = useMemo(() => {
    const path = location.pathname;
    return path.startsWith('/client/dashboard') || path.startsWith('/owner/dashboard');
  }, [location.pathname]);

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

  // 🚀 NEXUS AUDIO: Welcome sound on startup or login
  const hasPlayedWelcome = useRef(false);
  useEffect(() => {
    if (user && !hasPlayedWelcome.current) {
      uiSounds.playWelcome();
      hasPlayedWelcome.current = true;
    }
  }, [user]);

  // Filters removed from here since they are unused



  useEffect(() => {
    const recover = () => window.dispatchEvent(new CustomEvent('swipess-ui-recovery'));
    recover();
    const frame = requestAnimationFrame(recover);
    
    // 🚀 SWIPESS READY SIGNAL:
    // Notifies RootProviders that the layout shell is mounted.
    // This allows the splash screen to fade out ONLY when content is ready.
    window.dispatchEvent(new CustomEvent('swipess-ready'));
    
    // Fallback for legacy listeners
    window.dispatchEvent(new CustomEvent('app-rendered'));

    // 🧘 ZEN TAP: Global click listener for meditation bowl sounds
    const handleGlobalTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, select, [role="button"]');
      
      // 🚫 EXCLUDE PHOTO TAPS: User specifically requested NO SOUND on photo changes
      const isCardImage = target.closest('[data-swipe-card-image]');
      
      if (isInteractive && !isCardImage) {
        uiSounds.playTap();
      }
    };

    window.addEventListener('mousedown', handleGlobalTap);
    
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousedown', handleGlobalTap);
    };
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
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} triggered={triggered} />
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>
  
      {showAppChrome && (
        <Suspense fallback={null}>
          <SwipessHud side="top" className="fixed top-0 left-0 right-0 z-[10005]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={true}>
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
          <SwipessHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[10005]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={true}>
            <BottomNavigation
              userRole={userRole}
              onFilterClick={handleFilterClick}
              onListingsClick={handleListingsClick}
            />
          </SwipessHud>
        </Suspense>
      )}

      {/* 📻 CONNECTED RADIO: Floating player bubble - Hidden on radio/full-screen routes */}
      {showAppChrome && !isFullScreen && (
        <Suspense fallback={null}>
          <RadioMiniPlayer />
        </Suspense>
      )}
      
      {/* 🤖 VOICE CONCIERGE: Left-side floating assistant */}
      {showAppChrome && !isFullScreen && (
        <Suspense fallback={null}>
          <VoiceConciergeButton />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <VapIdCardModal
          isOpen={modalStore.showVapId}
          onClose={() => modalStore.setModal('showVapId', false)}
        />
        <GlobalDialogs />
      </Suspense>
    </div>
  );
}


