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
    
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');
  const isAuthRoute = location.pathname === '/' || location.pathname === '/reset-password';
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');

  const isImmersive = useMemo(() => {
    const path = location.pathname;
    
    // ONLY the two primary swipe discovery decks should be immersive (no scroll).
    // Everything else — messages, likes, properties, settings, profile, escrow,
    // documents, subscriptions — must scroll via DashboardLayout's scroll container.
    const swipeOnlyRoutes = [
      '/client/dashboard',
      '/owner/dashboard',
    ];
    
    return swipeOnlyRoutes.some(r => path === r || path === r + '/');
  }, [location.pathname]);

  const isFullScreen = useMemo(() => {
    const path = location.pathname;
    const isRadio = path.startsWith('/radio');
    const isCamera = path.startsWith('/camera');
    return isCamera || isRadio || showAIChat;
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
            transparent={isImmersive}
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

      {/* 🛸 NO-LOCK MAIN CONTAINER: Allows children to expand the body natively */}
      <main
        id="main-content"
        className={cn(
          "w-full flex-1 relative z-0 flex flex-col",
          // 🛡️ ZENITH PROTECTION: Ensure Dashboards are never double-scrollable
          (isImmersive || isFullScreen) ? "h-full overflow-hidden" : "overflow-y-auto scroll-area-momentum"
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


