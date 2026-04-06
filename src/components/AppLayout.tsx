import { Suspense, lazy, useMemo, useEffect } from 'react';
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

  const userRole = user?.user_metadata?.role === 'admin' ? 'admin' : activeMode;

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); // ZERO-LATENCY GLOBAL BINDINGS

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
  
  // Immersive sections where header starts transparent
  const isImmersive = useMemo(() => {
    const immersiveRoutes = ['/client/dashboard', '/owner/dashboard', '/client/profile', '/owner/profile'];
    return immersiveRoutes.some(r => location.pathname.startsWith(r)) || 
           location.pathname.includes('discovery') || 
           location.pathname.includes('eventos') ||
           location.pathname.includes('roommates');
  }, [location.pathname]);

  // Fullscreen routes hide HUD entirely
  const isFullScreen = useMemo(() => {
    const path = location.pathname;
    return isCameraRoute || 
           isRadioRoute || 
           path.includes('/camera') || 
           path.includes('roommates') || 
           path.includes('eventos');
  }, [isCameraRoute, isRadioRoute, location.pathname]);

  const handleMessageActivationsClick = () => navigate('/subscription/packages');
  const handleListingsClick = () => {
    if (userRole === 'owner') navigate('/owner/properties');
    else navigate('/client/liked-properties');
  };

  const handleFilterClick = () => {
    if (userRole === 'owner') navigate('/owner/filters');
    else navigate('/client/filters');
  };

  const handleAIInteraction = () => {
    if (userRole === 'owner') navigate('/owner/listings/new-ai');
    else modalStore.setModal('isAISearchOpen', true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative selection:bg-brand-primary/30">
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>
 
      <div className="flex flex-col flex-1 h-full w-full min-h-0 overflow-hidden relative">
        {/* 🚀 PERMANENT HUD: Universal and stable header/footer architecture */}
        {!isAuthRoute && !isFullScreen && (!isPublicPreview || !!user) && (
          <TopBar
            userRole={userRole}
            onMessageActivationsClick={handleMessageActivationsClick}
            transparent={isImmersive} // Respect immersive transparency for discovery
            showBack={location.pathname !== '/client/dashboard' && location.pathname !== '/owner/dashboard'}
            className="z-[9999]"
          />
        )}
 
        {/* Primary content area: fills available space between bars */}
        <main
          id="main-content"
          className={cn(
            "flex-1 w-full h-full relative z-0 touch-pan-y overflow-y-auto scroll-smooth"
          )}
        >
          {children}
        </main>
      </div>

      {/* 🚀 PERMANENT HUD: Always visible footer per user request */}
      {!isAuthRoute && !isFullScreen && (!isPublicPreview || !!user) && (
        <>
          <BottomNavigation
            userRole={userRole}
            onFilterClick={handleFilterClick}
            onAISearchClick={handleAIInteraction}
            onListingsClick={handleListingsClick}
            className="z-[9999]"
          />

          {/* Radio Mini Player */}
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] left-4 right-4 z-50 pointer-events-none">
            <div className="pointer-events-auto">
              <Suspense fallback={null}>
                <RadioMiniPlayer />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 🛰️ BUILD STATUS: 2026-04-05T17:00:00Z - AI RESET & NAVIGATION BRIDGE LIVE
