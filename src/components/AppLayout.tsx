import { Suspense, lazy, useMemo, useEffect, useState } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';

import { useLocation } from 'react-router-dom';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useAuth } from '@/hooks/useAuth';

import useAppTheme from '@/hooks/useAppTheme';
import { TopBar } from './TopBar';
import { BottomNavigation } from './BottomNavigation';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useModalStore } from '@/state/modalStore';
import { useInstantReactivity } from '@/hooks/useInstantReactivity';
import { cn } from '@/lib/utils';
import { SentientHud } from './SentientHud';
import { VapIdCardModal } from './VapIdCardModal';
import { RadioMiniPlayer } from './RadioMiniPlayer';
import { uiSounds } from '@/utils/uiSounds'; // ZENITH AUDIO ENGINE

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
  const { isRefreshing, pullDistance, triggered } = usePullToRefresh();

  const userRole = user?.user_metadata?.role === 'admin' ? 'admin' : activeMode;

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); 

  const { t } = useTranslation();

  // Filters removed from here since they are unused



  useEffect(() => {
    const recover = () => window.dispatchEvent(new CustomEvent('sentient-ui-recovery'));
    recover();
    const frame = requestAnimationFrame(recover);
    
    // 🚀 ZENITH READY SIGNAL:
    // Notifies RootProviders that the layout shell is mounted.
    // This allows the splash screen to fade out ONLY when content is ready.
    window.dispatchEvent(new CustomEvent('zenith-ready'));
    
    // Fallback for legacy listeners
    window.dispatchEvent(new CustomEvent('app-rendered'));

    // 🧘 ZEN TAP: Global click listener for meditation bowl sounds
    const handleGlobalTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, select, [role="button"]');
      
      const isDashboard = location.pathname === '/client/dashboard' || location.pathname === '/owner/dashboard';

      if (isInteractive) {
        uiSounds.playWaterDrop();
      } else if (isDashboard) {
        uiSounds.playZenBowl();
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
    // Dashboard swipe pages are full-bleed — top bar floats transparently over them
    const isSwipeDashboard = path === '/client/dashboard' || path === '/owner/dashboard' ||
      path === '/client/dashboard/' || path === '/owner/dashboard/';
    return isCamera || isRadio || showAIChat || isSwipeDashboard;
  }, [location.pathname, showAIChat]);

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
  
      {!isAuthRoute && !isFullScreen && !isRadioRoute && !isCameraRoute && (!isPublicPreview || !!user) && (
        <SentientHud side="top" className="fixed top-0 left-0 right-0 z-[10005]" scrollTargetSelector="#dashboard-scroll-container">
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
        </SentientHud>
      )}

      {/* 🌑 ATMOSPHERIC VIGNETTE: Subtle edge darkening for focus depth */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-60 mix-blend-multiply" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.15) 100%)' 
        }} 
      />

      {/* SHELL CONTAINER: Always fixed-height. DashboardLayout handles scrolling inside. */}
      <main
        id="main-content"
        className={cn(
          "w-full flex-1 relative z-0 flex flex-col",
          // Push content down below the fixed header
          !isAuthRoute && !isFullScreen && !isRadioRoute && !isCameraRoute && "pt-[var(--top-bar-height)]",
          // Dashboard pages: overflow-hidden, DashboardLayout scrolls internally
          // Public/standalone pages: overflow-y-auto, scroll at this level
          (isInsideDashboard || isFullScreen) ? "overflow-hidden" : "overflow-y-auto scroll-area-momentum pb-[var(--bottom-nav-height)]"
        )}
      >
        <div className="w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>

      <VapIdCardModal
        isOpen={modalStore.showVapId}
        onClose={() => modalStore.setModal('showVapId', false)}
      />



      {!isAuthRoute && !isFullScreen && !isRadioRoute && !isCameraRoute && (!isPublicPreview || !!user) && (
        <SentientHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[9999]" scrollTargetSelector="#dashboard-scroll-container">
          <BottomNavigation
            userRole={userRole}
            onFilterClick={handleFilterClick}
            onListingsClick={handleListingsClick}
          />
        </SentientHud>
      )}

      {/* 📻 CONNECTED RADIO: Floating player bubble - Hidden on radio/full-screen routes */}
      {!isFullScreen && <RadioMiniPlayer />}
    </div>
  );
}


