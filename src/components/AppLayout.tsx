import { Suspense, lazy, useMemo, useEffect, useState } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';

import { useLocation } from 'react-router-dom';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useAuth } from '@/hooks/useAuth';

import { useTheme } from '@/hooks/useTheme';
import { TopBar } from './TopBar';
import { BottomNavigation } from './BottomNavigation';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useModalStore } from '@/state/modalStore';
import { useInstantReactivity } from '@/hooks/useInstantReactivity';
import { cn } from '@/lib/utils';
import { SentientHud } from './SentientHud';
import { VapIdCardModal } from './VapIdCardModal';

const NotificationSystem = lazy(() =>
  import('@/components/NotificationSystem').then(m => ({ default: m.NotificationSystem }))
);

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const modalStore = useModalStore();
  const { showAIChat } = modalStore;
  const { activeMode } = useActiveMode();
  const { isRefreshing, pullDistance, triggered } = usePullToRefresh();
  const [activeTab, setActiveTabState] = useState<'explore' | 'manage'>('explore');

  // Handle tab change with navigation logic
  const handleTabChange = (tab: 'explore' | 'manage') => {
    setActiveTabState(tab);
    if (tab === 'manage') {
      if (userRole === 'owner') navigate('/owner/properties');
      else navigate('/client/liked-properties');
    } else {
      if (userRole === 'owner') navigate('/owner/dashboard');
      else navigate('/client/dashboard');
    }
  };

  // Sync tab state with location
  useEffect(() => {
    if (location.pathname.includes('dashboard')) setActiveTabState('explore');
    else if (location.pathname.includes('liked') || location.pathname.includes('properties')) setActiveTabState('manage');
  }, [location.pathname]);

  const userRole = user?.user_metadata?.role === 'admin' ? 'admin' : activeMode;

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); 

  useEffect(() => {
    const recover = () => window.dispatchEvent(new CustomEvent('sentient-ui-recovery'));
    recover();
    const frame = requestAnimationFrame(recover);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');
  const isAuthRoute = location.pathname === '/' || location.pathname === '/reset-password';
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');

  const isImmersive = useMemo(() => {
    const immersiveRoutes = [
      '/client/dashboard', 
      '/owner/dashboard', 
      '/client/liked-properties',
      '/owner/properties',
      '/owner/interested-clients',
      '/owner/liked-clients',
      '/client/advertise',
      '/explore/eventos',
      '/client/profile',
      '/owner/profile'
    ];
    return immersiveRoutes.some(r => location.pathname.startsWith(r)) || 
           location.pathname.includes('discovery') || 
           location.pathname.includes('/listing/');
  }, [location.pathname]);

  const isFullScreen = useMemo(() => {
    return isCameraRoute || isRadioRoute || showAIChat || modalStore.showMapFullscreen;
  }, [isCameraRoute, isRadioRoute, showAIChat, modalStore.showMapFullscreen]);

  const handleFilterClick = () => {
    modalStore.setModal('showFilters', true);
  };

  const handleListingsClick = () => {
    if (userRole === 'owner') navigate('/owner/properties');
    else navigate('/client/liked-properties');
  };

  const handleMessageActivationsClick = () => navigate('/subscription/packages');

  return (
    <div className={cn(
      "w-full min-h-screen flex flex-col relative selection:bg-brand-primary/30", 
      "bg-background",
      theme === 'Swipess-style' && "Swipess-style"
    )}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} triggered={triggered} />
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>
  
      {!isAuthRoute && !isFullScreen && (!isPublicPreview || !!user) && (
        <SentientHud side="top" className="fixed top-0 left-0 right-0 z-[9999]">
          <TopBar
            userRole={userRole}
            onMessageActivationsClick={handleMessageActivationsClick}
            onFilterClick={handleFilterClick}
            transparent={isImmersive}
            showBack={location.pathname !== '/client/dashboard' && location.pathname !== '/owner/dashboard'}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </SentientHud>
      )}


      {/* 🛸 NO-LOCK MAIN CONTAINER: Allows children to expand the body natively */}
      <main
        id="main-content"
        className={cn(
          "w-full flex-1 relative z-0 flex flex-col items-center",
          isFullScreen && "h-screen overflow-hidden fixed inset-0"
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

      {!isAuthRoute && !isFullScreen && (!isPublicPreview || !!user) && (
        <SentientHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[9999]">
          <BottomNavigation
            userRole={userRole}
            onFilterClick={handleFilterClick}
            onListingsClick={handleListingsClick}
          />
        </SentientHud>
      )}
    </div>
  );
}


