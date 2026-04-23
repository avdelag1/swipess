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
  const { showAIChat } = modalStore;
  const { activeMode } = useActiveMode();
  const { isRefreshing, pullDistance, triggered } = usePullToRefresh();

  const userRole = user?.user_metadata?.role === 'admin' ? 'admin' : activeMode;

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();
  useInstantReactivity(); 

  const { t } = useTranslation();
  const [showOwnerFilters, setShowOwnerFilters] = useState(false);
  const { filters, setFilters, activeCategory, radiusKm, setRadiusKm } = useFilterStore(
    useShallow((s) => ({
      filters: s.filters,
      setFilters: s.setFilters,
      activeCategory: s.activeCategory,
      radiusKm: s.radiusKm,
      setRadiusKm: s.setRadiusKm
    }))
  );

  useEffect(() => {
    const handleOpenFilters = () => {
      if (location.pathname.includes('/owner/')) {
        setShowOwnerFilters(true);
      }
    };
    window.addEventListener('open-owner-filters', handleOpenFilters);
    return () => window.removeEventListener('open-owner-filters', handleOpenFilters);
  }, [location.pathname]);

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
    return isCameraRoute || isRadioRoute || showAIChat;
  }, [isCameraRoute, isRadioRoute, showAIChat]);

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
        <SentientHud side="top" className="fixed top-0 left-0 right-0 z-[10005]">
          <TopBar
            userRole={userRole}
            onMessageActivationsClick={handleMessageActivationsClick}
            onFilterClick={handleFilterClick}
            transparent={isImmersive}
            showBack={location.pathname !== '/client/dashboard' && location.pathname !== '/owner/dashboard'}
          />
        </SentientHud>
      )}


      {/* 🛸 NO-LOCK MAIN CONTAINER: Allows children to expand the body natively */}
      <main
        id="main-content"
        className={cn(
          "w-full flex-1 relative z-0 flex flex-col",
          (isFullScreen && !location.pathname.includes('/owner/')) && "h-screen overflow-hidden fixed inset-0"
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

      {/* 🛸 GLOBAL OWNER FILTER SHEET */}
      <Sheet open={showOwnerFilters} onOpenChange={setShowOwnerFilters}>
         <SheetContent side="bottom" className="h-[92vh] p-0 border-none bg-transparent overflow-hidden z-[10006]">
            <div className="w-full h-full glass-morphism rounded-t-[3.5rem] border-t border-white/10 overflow-y-auto">
               <div className="sticky top-0 z-[60] flex items-center justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
               </div>
               <div className="px-6 pb-20 pt-4">
                  <h2 className="text-xl font-black uppercase tracking-widest italic mb-6">{t('topbar.targetPlatform')}</h2>
                  <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>}>
                    <DiscoveryFilters
                      category={(activeCategory as any) || 'property'}
                      onApply={(newFilters) => {
                        setFilters(newFilters);
                        setShowOwnerFilters(false);
                      }}
                      initialFilters={filters}
                      activeCount={0}
                    />
                  </Suspense>
               </div>
            </div>
         </SheetContent>
      </Sheet>

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


