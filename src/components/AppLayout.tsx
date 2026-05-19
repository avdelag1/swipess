import { Suspense, lazy, useMemo, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';

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
const SwipessHud = lazyWithRetry(() => import('./SwipessHud').then(m => ({ default: m.SwipessHud })));
const VapIdCardModal = lazyWithRetry(() => import('./VapIdCardModal').then(m => ({ default: m.VapIdCardModal })));
const GlobalDialogs = lazyWithRetry(() => import('./GlobalDialogs').then(m => ({ default: m.GlobalDialogs })));
import { ChromeSummonZones } from './swipe/ChromeSummonZones';
import { revealChrome, useChromeReveal } from '@/hooks/useChromeReveal';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';


const NotificationSystem = lazy(() =>
  import('@/components/NotificationSystem').then(m => ({ default: m.NotificationSystem }))
);
const DiscoveryFilters = lazy(() =>
  import('@/components/filters/DiscoveryFilters').then(m => ({ default: m.DiscoveryFilters }))
);
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  const { showAIChat, showAIListing, showAIProfile } = modalStore;
  const { activeMode } = useActiveMode();

  const isSwipeDashboard = useMemo(() => {
    const path = location.pathname;
    return path.startsWith('/client/dashboard') || path.startsWith('/owner/dashboard');
  }, [location.pathname]);

  // Chrome visibility policy:
  //   • Dashboard "picking phase" (no quick filter selected yet): chrome
  //     is pinned — that's the navigation hub.
  //   • Dashboard "swipe deck" (a quick-filter category is active and
  //     cards are on screen): chrome auto-hides for an immersive view
  //     of the photo. Re-summoned by tapping the top edge or the
  //     bottom-center summon zone.
  //   • Every other page: chrome hides on scroll-down, shows on scroll-up.
  const isDashboardPage = location.pathname.startsWith('/client/dashboard') ||
    location.pathname.startsWith('/owner/dashboard');
  const { selectedCategoriesCount, ownerPhase } = useFilterStore(
    useShallow((s) => ({
      selectedCategoriesCount: s.categories.length,
      ownerPhase: s.ownerPhase,
    }))
  );
  const isClientDash = location.pathname.startsWith('/client/dashboard');
  const isOwnerDash = location.pathname.startsWith('/owner/dashboard');
  const swipeDeckActive =
    (isClientDash && selectedCategoriesCount > 0) ||
    (isOwnerDash && ownerPhase === 'swipe');
  const { isChromeVisible } = useChromeReveal();
  const useRevealMode = swipeDeckActive && !showAIChat;
  const hideFloatingForSwipe = useRevealMode && !isChromeVisible;

  const userRole = useMemo<'client' | 'owner' | 'admin'>(() => {
    if (user?.user_metadata?.role === 'admin') return 'admin';
    if (location.pathname.startsWith('/owner/')) return 'owner';
    if (location.pathname.startsWith('/client/')) return 'client';
    return activeMode;
  }, [activeMode, location.pathname, user?.user_metadata?.role]);

  const isInsideDashboard = useMemo(() => {
    const path = location.pathname;
    const authRoutes = ['/client', '/owner', '/admin'];
    return authRoutes.some(r => path.startsWith(r));
  }, [location.pathname]);

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); 

  const { t } = useTranslation();

  // In-app audio fully disabled — sounds are reserved for the public
  // landing-page cosmos background only (LandingBackgroundEffects.tsx).

  // Filters removed from here since they are unused



  useEffect(() => {
    const recover = () => window.dispatchEvent(new CustomEvent('swipess-ui-recovery'));
    recover();
    const frame = requestAnimationFrame(recover);
    
    // 🚀 SWIPESS READY SIGNAL:
    // Notifies RootProviders that the layout shell is mounted.
    // This allows the splash screen to fade out ONLY when content is ready.
    window.dispatchEvent(new CustomEvent('swipess-ready'));
    window.dispatchEvent(new CustomEvent('app-rendered'));

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  // Auto-close ALL overlay popups when the route changes
  useEffect(() => {
    useModalStore.getState().closeAll();
  }, [location.pathname]);

  // Force dark theme on all Dashboard routes for the premium "black filter" experience
  useLayoutEffect(() => {
    document.body.classList.toggle('swipe-deck-active', swipeDeckActive);
    
    if (isInsideDashboard) {
      document.documentElement.classList.add('dark', 'black-matte');
      document.documentElement.classList.remove('light', 'white-matte', 'cheers', 'red-matte', 'amber-matte', 'pure-black', 'Swipess-style');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      // Restore user's actual theme when leaving dashboard
      if (theme === 'light') {
        document.documentElement.classList.add('light', 'white-matte');
        document.documentElement.classList.remove('dark', 'black-matte');
        document.documentElement.style.colorScheme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        if (theme === 'dark') document.documentElement.classList.add('black-matte');
        document.documentElement.classList.remove('light', 'white-matte');
        document.documentElement.style.colorScheme = 'dark';
      }
    }
    
    return () => document.body.classList.remove('swipe-deck-active');
  }, [isInsideDashboard, swipeDeckActive, theme]);

  // Discoverability: when entering swipe-deck reveal mode (chrome auto-hides),
  // briefly show the header + bottom nav so users see the controls exist
  // before they fade out. Auto-hide timer (5s) is set by revealChrome().
  const wasRevealRef = useRef(false);
  useLayoutEffect(() => {
    if (useRevealMode && !wasRevealRef.current) {
      revealChrome();
    }
    wasRevealRef.current = useRevealMode;
  }, [useRevealMode]);

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');
  const isAuthRoute = location.pathname === '/' || location.pathname === '/reset-password';
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');

  const isFullScreen = useMemo(() => {
    const path = location.pathname;
    const isRadio = path.startsWith('/radio');
    const isCamera = path.startsWith('/camera');
    const isRoommates = path.startsWith('/explore/roommates');
    const isMessages = path.startsWith('/messages');
    const isEvents = path.startsWith('/explore/events');
    return isCamera || isRadio || showAIChat || showAIListing || showAIProfile || isSwipeDashboard || isRoommates || isMessages || isEvents;
  }, [location.pathname, showAIChat, showAIListing, showAIProfile, isSwipeDashboard]);

  const isEventsRoute = location.pathname.startsWith('/explore/events');
  const isRoommatesRoute = location.pathname.startsWith('/explore/roommates');
  const showAppChrome = !isAuthRoute && !isRadioRoute && !isCameraRoute && !showAIChat && !showAIListing && !showAIProfile && !isEventsRoute && !isRoommatesRoute && (!isPublicPreview || !!user);

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
          <SwipessHud side="top" className="fixed top-0 left-0 right-0 z-[40]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={isDashboardPage && !swipeDeckActive} revealMode={useRevealMode}>
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
          "w-full flex-1 relative z-0 flex flex-col min-h-0",
          // Restore pt/pb for non-dashboard pages to prevent content overlap with floating header
          !isInsideDashboard && !isFullScreen && "pt-[var(--top-bar-height)] pb-[var(--bottom-nav-height)]",
          (isInsideDashboard || isFullScreen) ? "overflow-hidden" : "overflow-y-auto scroll-area-momentum"
        )}
      >
        <div className="w-full flex-1 flex flex-col min-h-0 h-full relative">
          {children}
        </div>
      </main>





      {showAppChrome && (
        <Suspense fallback={null}>
          <SwipessHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[40]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={isDashboardPage && !swipeDeckActive} revealMode={useRevealMode}>
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


