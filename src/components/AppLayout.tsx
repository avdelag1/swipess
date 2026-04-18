import { Suspense, lazy, useMemo, useEffect, useRef } from 'react';
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

const RadioMiniPlayer = lazy(() =>
  import('@/components/RadioMiniPlayer').then(m => ({ default: m.RadioMiniPlayer }))
);
const NotificationSystem = lazy(() =>
  import('@/components/NotificationSystem').then(m => ({ default: m.NotificationSystem }))
);

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const modalStore = useModalStore();
  const { activeMode } = useActiveMode();
  const { isRefreshing, pullDistance, triggered } = usePullToRefresh();

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

  useEffect(() => {
    if (isAuthRoute || !user) return;
    const prewarm = () => { import('@/components/ConciergeChat').catch(() => {}); };
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prewarm, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = globalThis.setTimeout(prewarm, 900);
    return () => globalThis.clearTimeout(timeoutId);
  }, [isAuthRoute, user]);
  
  const isImmersive = useMemo(() => {
    const immersiveRoutes = [
      '/client/dashboard', 
      '/owner/dashboard', 
      '/client/liked-properties',
      '/owner/properties',
      '/owner/interested-clients',
      '/owner/liked-clients',
      '/client/advertise',
      '/explore/eventos'
    ];
    const hideHUDRoutes = ['/explore/eventos', '/explore/roommates'];
    return immersiveRoutes.some(r => location.pathname.startsWith(r)) || 
           location.pathname.includes('discovery') || 
           location.pathname.includes('/listing/') ||
           hideHUDRoutes.some(r => location.pathname.startsWith(r));
  }, [location.pathname]);

  const { showAIChat } = useModalStore();

  const isFullScreen = useMemo(() => {
    const path = location.pathname;
    const hideHUDRoutes = ['/explore/eventos', '/explore/roommates'];
    return isCameraRoute || isRadioRoute || path.includes('/camera') || path.includes('roommates') || path.includes('eventos') || showAIChat;
  }, [isCameraRoute, isRadioRoute, location.pathname, showAIChat]);

  const handleMessageActivationsClick = () => navigate('/subscription/packages');
  const handleListingsClick = () => {
    if (userRole === 'owner') navigate('/owner/properties');
    else navigate('/client/liked-properties');
  };

  const handleFilterClick = () => {
    if (userRole === 'owner') navigate('/owner/filters');
    else navigate('/client/filters');
  };

  return (
    <div className={cn("flex flex-col h-screen w-full bg-background relative selection:bg-brand-primary/30", isRadioRoute ? "overflow-visible" : "overflow-hidden")}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} triggered={triggered} />
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>
 
      <div className="flex flex-col flex-1 h-full w-full min-h-0 overflow-hidden relative">
        {!isAuthRoute && !isFullScreen && (!isPublicPreview || !!user) && (
          <SentientHud side="top" className="fixed top-0 left-0 right-0 z-[9999]">
            <TopBar
              userRole={userRole}
              onMessageActivationsClick={handleMessageActivationsClick}
              onFilterClick={handleFilterClick}
              transparent={isImmersive}
              showBack={location.pathname !== '/client/dashboard' && location.pathname !== '/owner/dashboard'}
            />
          </SentientHud>
        )}
 
        <main
          id="main-content"
          className={cn(
            "flex-1 w-full h-full min-h-0 relative z-0 touch-pan-y overflow-x-hidden overflow-y-auto scroll-smooth",
          )}
        >
          {children}
        </main>

        <VapIdCardModal
          isOpen={modalStore.showVapId}
          onClose={() => modalStore.setModal('showVapId', false)}
        />
      </div>

      {!isAuthRoute && !isFullScreen && (!isPublicPreview || !!user) && (
        <>
          <SentientHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[9999]">
            <BottomNavigation
              userRole={userRole}
              onFilterClick={handleFilterClick}
              onListingsClick={handleListingsClick}
            />
          </SentientHud>

          {!([
            '/client/liked-properties',
            '/owner/liked-clients',
            '/owner/interested-clients',
            '/client/who-liked-you',
          ].some(path => location.pathname === path || location.pathname.startsWith(`${path}/`)) || showAIChat) && (
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] left-4 right-4 z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <Suspense fallback={null}>
                  <RadioMiniPlayer />
                </Suspense>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
