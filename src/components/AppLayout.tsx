import { Suspense, lazy, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useAuth } from '@/hooks/useAuth';

import { useTheme } from '@/hooks/useTheme';
import { AnimatePresence, motion } from 'framer-motion';
import { SentientHud } from './SentientHud';
import { TopBar } from './TopBar';
import { BottomNavigation } from './BottomNavigation';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useModalStore } from '@/state/modalStore';
import { useInstantReactivity } from '@/hooks/useInstantReactivity';

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

  const userRole = (user?.user_metadata?.role as 'client' | 'owner' | 'admin') || 'client';

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); // ZERO-LATENCY GLOBAL BINDINGS

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');
  const isAuthRoute = location.pathname === '/' || location.pathname === '/reset-password';
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');
  
  // Immersive sections where header starts transparent
  const isImmersive = useMemo(() => {
    const immersiveRoutes = ['/client/dashboard', '/owner/dashboard', '/client/profile', '/owner/profile'];
    return immersiveRoutes.some(r => location.pathname.startsWith(r)) || 
           location.pathname.includes('discovery') || 
           location.pathname.includes('eventos');
  }, [location.pathname]);

  // Fullscreen routes hide HUD entirely
  const isFullScreen = isCameraRoute || isRadioRoute || location.pathname.includes('/camera');

  const handleMessageActivationsClick = () => navigate('/subscription/packages');
  const handleListingsClick = () => {
    if (userRole === 'owner') navigate('/owner/properties');
    else navigate('/client/liked-properties');
  };

  const isModalOpen = modalStore.isAISearchOpen || modalStore.showFilters || modalStore.showProfile;

  return (
    <div className="min-h-screen min-h-dvh w-full bg-background overflow-x-hidden relative">
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>

      {/* 🧘 GLOBAL UNIVERSAL HUD (Sentient Header) */}
      {!isAuthRoute && !isFullScreen && !isPublicPreview && !isModalOpen && (
        <SentientHud side="top" className="fixed top-0 left-0 right-0 z-[1000]">
          <TopBar
            onNotificationsClick={() => {}} 
            onMessageActivationsClick={handleMessageActivationsClick}
            showFilters={false} // Managed by specific pages
            userRole={userRole}
            transparent={isImmersive}
            title=""
            showBack={location.pathname !== '/client/dashboard' && location.pathname !== '/owner/dashboard'}
          />
        </SentientHud>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden relative z-10"
      >
        {children}
      </main>

      {/* 🧘 GLOBAL UNIVERSAL HUD (Sentient Footer) */}
      {!isAuthRoute && !isFullScreen && !isPublicPreview && !isModalOpen && (
        <>
          <SentientHud side="bottom" className="fixed bottom-0 left-0 right-0 z-[1000]">
            <BottomNavigation
              userRole={userRole}
              onFilterClick={() => modalStore.setModal('showFilters', true)}
              onAddListingClick={() => modalStore.setModal('showCategoryDialog', true)}
              onListingsClick={handleListingsClick}
              onAISearchClick={() => {
                if (userRole === 'owner') navigate('/owner/listings/new-ai');
                else modalStore.setModal('isAISearchOpen', true);
              }}
            />
          </SentientHud>

          {/* Radio Mini Player follows HUD state */}
          <AnimatePresence>
            <SentientHud side="bottom" mode="fade" className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] left-4 right-4 z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <Suspense fallback={null}>
                  <RadioMiniPlayer />
                </Suspense>
              </div>
            </SentientHud>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
