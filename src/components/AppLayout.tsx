import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { useGlobalBackButton } from '@/hooks/useGlobalBackButton';
import { useProfileGpsPersist } from '@/hooks/useProfileGpsPersist';
import { useDeepLinks } from '@/hooks/useDeepLinks';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import { cn } from '@/lib/utils';
const TopBar = lazyWithRetry(() => import('./TopBar').then(m => ({ default: m.TopBar })));
const BottomNavigation = lazyWithRetry(() => import('./BottomNavigation').then(m => ({ default: m.BottomNavigation })));
const RadioMiniPlayer = lazyWithRetry(() => import('./RadioMiniPlayer').then(m => ({ default: m.RadioMiniPlayer })));
const SwipessHud = lazyWithRetry(() => import('./SwipessHud').then(m => ({ default: m.SwipessHud })));
const PassportMapModal = lazyWithRetry(() =>
  import('./PassportMapModal').then(m => ({ default: m.PassportMapModal })),
);
const VapIdCardModal = lazyWithRetry(() => import('./VapIdCardModal').then(m => ({ default: m.VapIdCardModal })));
const GlobalDialogs = lazyWithRetry(() => import('./GlobalDialogs').then(m => ({ default: m.GlobalDialogs })));
import { ChromeSummonZones } from './swipe/ChromeSummonZones';
import { enableChromeAutoHide, resetChromeAutoHide, revealChrome, showChromePersistent, useChromeReveal } from '@/hooks/useChromeReveal';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { UNIFIED_CARDS } from '@/components/swipe/SwipeConstants';
import { prefetchPassportMapImmediate } from '@/utils/prefetchMapModule';
import { seedGpsCache } from '@/utils/mapGpsCache';


const NotificationSystem = lazyWithRetry(() =>
  import('@/components/NotificationSystem').then(m => ({ default: m.NotificationSystem }))
);


interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useAppTheme();
  const location = useLocation();
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const modalStore = useModalStore();
  const { showAIChat, showAIListing, showAIProfile, showPassportMapModal } = modalStore;
  const [keepMapMounted, setKeepMapMounted] = useState(false);
  const { activeMode } = useActiveMode();
  useDeepLinks();
  useProfileGpsPersist();

  const isSwipeDashboard = useMemo(() => {
    const path = location.pathname;
    return path.startsWith('/client/dashboard') || path.startsWith('/owner/dashboard');
  }, [location.pathname]);

  // Mount only when opened — dashboard prefetch warms modules without eager Mapbox init.
  const mountPassportMap = keepMapMounted || showPassportMapModal;

  useLayoutEffect(() => {
    if (mountPassportMap && !keepMapMounted) {
      setKeepMapMounted(true);
    }
  }, [mountPassportMap, keepMapMounted]);

  useEffect(() => {
    // Warm Mapbox + GPS on dashboard so map open snaps to you instantly.
    if (showPassportMapModal || isSwipeDashboard) {
      prefetchPassportMapImmediate();

      // Seed GPS cache from store only — no geolocation API on boot (caused iOS crashes).
      const { userLatitude, userLongitude, passportMode } = useFilterStore.getState();
      if (!passportMode && userLatitude != null && userLongitude != null) {
        seedGpsCache(userLatitude, userLongitude);
      }
    }
  }, [showPassportMapModal, isSwipeDashboard]);

  // Chrome visibility policy:
  //   • Dashboard "picking phase" (no quick filter selected yet): chrome
  //     is pinned — that's the navigation hub.
  //   • Dashboard "swipe deck" (a quick-filter category is active and
  //     cards are on screen): chrome auto-hides for an immersive view
  //     of the photo. Re-summoned by tapping the top edge or the
  //     bottom-center summon zone.
  //   • Every other page: chrome hides on scroll-down, shows on scroll-up.
  const isRoommatesRoute = location.pathname.startsWith('/explore/roommates');
  const isEventsRoute = location.pathname.startsWith('/explore/events');

  const isDashboardPage = location.pathname.startsWith('/client/dashboard') ||
    location.pathname.startsWith('/owner/dashboard') || isRoommatesRoute;
  const { selectedCategoriesCount, ownerPhase } = useFilterStore(
    useShallow((s) => ({
      selectedCategoriesCount: s.categories.length,
      ownerPhase: s.ownerPhase,
    }))
  );
  const isClientDash = location.pathname.startsWith('/client/dashboard');
  const isOwnerDash = location.pathname.startsWith('/owner/dashboard');
  const swipeDeckActive =
    isClientDash ||
    (isOwnerDash && ownerPhase === 'swipe') ||
    isRoommatesRoute;
  // Immersive single-card detail pages (a listing or profile opened on its
  // own — e.g. a property surfaced by the AI concierge) get the same
  // auto-hide chrome behaviour as the swipe deck: the header + bottom nav
  // fade first, then the card's vertical action rail.
  const isImmersiveCardRoute =
    location.pathname.startsWith('/listing/') ||
    location.pathname.startsWith('/profile/');
  const { isChromeVisible } = useChromeReveal();
  // Reveal-mode (chrome auto-hides after a short idle window) applies to:
  //   • Immersive single-card detail pages (/listing/, /profile/)
  //   • The dashboard swipe deck — when cards are on screen the header,
  //     bottom nav and right-side action rail all fade so the photo is
  //     unobstructed. A tap anywhere on the chrome summon zones brings
  //     them back.
  const useRevealMode = (isImmersiveCardRoute || swipeDeckActive) && !showAIChat;
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

  // Only the actual dashboard page gets forced dark theme — NOT profile,
  // settings, AI chat, roommates, etc.
  const isDashboardOnly = isDashboardPage;

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); 
  useGlobalBackButton();



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

  // Force dark theme ONLY on the dashboard page for the premium "black filter" experience
  useLayoutEffect(() => {
    document.body.classList.toggle('swipe-deck-active', swipeDeckActive);
    // Apply user's actual theme across the entire app
    if (theme === 'light' || theme === 'white-matte') {
      document.documentElement.classList.add('light', 'white-matte');
      document.documentElement.classList.remove('dark', 'black-matte', 'grey-matte', 'red-matte', 'amber-matte', 'Swipess-style');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      if (theme === 'dark' || theme === 'black-matte') {
        document.documentElement.classList.add('black-matte');
      } else if (theme) {
        document.documentElement.classList.add(theme);
      }
      document.documentElement.classList.remove('light', 'white-matte');
      document.documentElement.style.colorScheme = 'dark';
    }
    
    return () => document.body.classList.remove('swipe-deck-active');
  }, [isDashboardOnly, swipeDeckActive, theme]);

  // Entering swipe-deck reveal mode: header + bottom nav + right rail are all
  // visible the moment the deck opens and STAY visible — the staggered auto-hide
  // (header + bottom nav at 3.5s, right rail at 4s) only begins once the user
  // actually picks a quick filter (see the category handler in the swipe
  // container, which calls revealChrome). Users summon the chrome back by
  // tapping the top or bottom edge (ChromeSummonZones); that resets the timer.
  const wasRevealRef = useRef(false);
  useLayoutEffect(() => {
    if (useRevealMode && !wasRevealRef.current) {
      // Dashboard deck: chrome stays up until the user picks a quick filter.
      // Immersive single-card routes (no quick filter) keep the old auto-hide.
      if (swipeDeckActive) {
        resetChromeAutoHide();
        showChromePersistent();
      } else {
        enableChromeAutoHide();
        revealChrome();
      }
    } else if (!useRevealMode && wasRevealRef.current) {
      // Left reveal mode — restore the default so other swipe surfaces (events
      // feed, owner swipe) auto-hide normally and don't inherit the dashboard's
      // "hold until filter" gate.
      enableChromeAutoHide();
    }
    wasRevealRef.current = useRevealMode;
  }, [useRevealMode, swipeDeckActive]);

  // Arm / disarm the staggered auto-hide based on whether a quick filter is
  // active. On the dashboard swipe surface the chrome is PINNED on the category
  // picker (the navigation hub, no category selected) and AUTO-HIDES once a
  // quick filter is active and the card deck is on screen — header + bottom nav
  // fade at 3.5s and the right-side action rail at 4s (see useChromeReveal).
  //
  // This MUST react to the active-category count, not just to entering reveal
  // mode. Previously the auto-hide was only ever armed from the "no results"
  // exhausted card, so the common path (open dashboard → pick a filter → swipe)
  // left autoHideEnabled false and the chrome never hid. Reacting to the count
  // also re-pins the chrome when the user taps back to the picker.
  useEffect(() => {
    if (!useRevealMode || !swipeDeckActive) return;
    if (selectedCategoriesCount > 0) {
      enableChromeAutoHide();
      revealChrome();
    } else {
      resetChromeAutoHide();
      showChromePersistent();
    }
  }, [useRevealMode, swipeDeckActive, selectedCategoriesCount]);

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');
  const isAuthRoute = location.pathname === '/' || location.pathname === '/reset-password';
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');
  const isSubscriptionRoute = location.pathname.startsWith('/subscription');

  const searchParams = new URLSearchParams(location.search);
  const hasActiveChat = searchParams.has('conversationId') || searchParams.has('startConversation');
  
  // Only hide chrome if they are actually INSIDE a specific chat
  const isDirectChat = location.pathname.startsWith('/messages') && hasActiveChat;

  const isProfile = location.pathname.startsWith('/profile') || location.pathname.startsWith('/preview/profile');
  const isListing = location.pathname.startsWith('/listing') || location.pathname.startsWith('/preview/listing');

  const isFullScreen = useMemo(() => {
    const path = location.pathname;
    const isRadio = path.startsWith('/radio');
    const isCamera = path.startsWith('/camera');
    const isEvents = path.startsWith('/explore/events');
    const isDirectChatInner = path.startsWith('/messages') && hasActiveChat;
    return isSubscriptionRoute || isCamera || isRadio || showAIListing || showAIProfile || isSwipeDashboard || isDirectChatInner || isEvents;
  }, [location.pathname, hasActiveChat, showAIListing, showAIProfile, isSwipeDashboard, isSubscriptionRoute]);

  const showAppChrome = !isSubscriptionRoute && !isAuthRoute && !isRadioRoute && !isCameraRoute && !showAIListing && !showAIProfile && !isEventsRoute && !isDirectChat && (!isPublicPreview || !!user);

  const handleFilterClick = () => {
    import('@/utils/prefetchCommonModals').then((m) => m.prefetchCommonModalsModule());
    if (isRoommatesRoute) {
      useModalStore.getState().setModal('showFilters', true);
    } else {
      const activeCategory = useFilterStore.getState().activeCategory;
      const dataType = UNIFIED_CARDS.find(c => c.id === activeCategory)?.dataType;
      
      if (dataType === 'people') {
        navigate('/owner/filters');
      } else {
        navigate('/client/filters');
      }
    }
  };

  const handleMessageActivationsClick = () => navigate('/subscription/packages');

  // GLOBAL PULL TO REFRESH
  // The dashboard has its own scroll container and PTR instance. This covers the rest of the app.
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const ptrDisabled = isInsideDashboard || swipeDeckActive || isFullScreen;
  const { isRefreshing, pullDistance, triggered } = usePullToRefresh({
    containerRef: mainScrollRef,
    disabled: ptrDisabled,
  });

  return (
    <div className={cn(
      "fixed inset-0 overflow-hidden bg-background text-foreground app-container",
      isPWA && "pwa-mode",
      isNative && "native-app-mode",
      useRevealMode && "reveal-mode"
    )}>
      {/* GLOBAL PULL TO REFRESH INDICATOR */}
      {!ptrDisabled && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          triggered={triggered}
        />
      )}
      
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>
  
      {showAppChrome && (
        <Suspense fallback={null}>
          <SwipessHud side="top" className="fixed top-0 left-0 right-0 z-[40]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={isDashboardPage && !useRevealMode} revealMode={useRevealMode}>
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

      <main
        ref={mainScrollRef}
        id="main-content"
        className={cn(
          "w-full flex-1 relative z-0 flex flex-col min-h-0",
          (swipeDeckActive || isFullScreen || isInsideDashboard) ? "overflow-hidden" : "overflow-y-auto scroll-area-momentum"
        )}
        style={(!isInsideDashboard && !isFullScreen && !isProfile && !isListing && !location.pathname.startsWith('/messages')) ? {
          paddingTop: 'calc(var(--top-bar-height, 72px) + var(--safe-top, 0px))',
          paddingBottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px))',
        } : undefined}
      >
        <div className={cn(
          "w-full flex-1 flex flex-col min-h-0 h-full relative",
          !swipeDeckActive && "select-text touch-auto"
        )}>
          {children}
        </div>
      </main>





      {showAppChrome && (
        <Suspense fallback={null}>
          <SwipessHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[40]" scrollTargetSelector="#dashboard-scroll-container" alwaysVisible={isDashboardPage && !useRevealMode} revealMode={useRevealMode}>
            <BottomNavigation
              userRole={userRole as any}
              onFilterClick={handleFilterClick}
              onAddListingClick={() => useModalStore.getState().openAddListing()}
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

      {/* Stay mounted after first open — tearing down Mapbox on every close caused crashes */}
      {mountPassportMap && (
        <Suspense
          fallback={
            showPassportMapModal ? (
              <div className="fixed inset-0 z-[10025] bg-[#0a0a12] flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-full max-w-sm h-[55vh] rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
                <div className="flex gap-2 w-full max-w-sm">
                  <div className="h-10 flex-1 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-10 flex-1 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-10 w-10 rounded-2xl bg-white/5 animate-pulse shrink-0" />
                </div>
              </div>
            ) : null
          }
        >
          <PassportMapModal />
        </Suspense>
      )}
    </div>
  );
}


