import { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { GradientMaskTop, GradientMaskBottom, GlobalVignette } from '@/components/ui/GradientMasks';
import { useTheme } from '@/hooks/useTheme';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { AnimatePresence, motion } from 'framer-motion';

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
  const { theme } = useTheme();
  const isLightTheme = theme === 'light';
  const location = useLocation();
  const { isFocused } = useFocusMode(6000);
  
  const { isVisible: isScrollVisible } = useScrollDirection({
    threshold: 25,
    showAtTop: true,
    resetTrigger: location.pathname
  });

  const showGlobalHUD = !isFocused && isScrollVisible;

  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();

  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');

  return (
    <div className="min-h-screen min-h-dvh w-full bg-background overflow-x-hidden relative">
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>

      {/* Cinematic depth layers — static CSS transitions instead of framer blur */}
      {!isPublicPreview && (
        <div 
          className="pointer-events-none transition-opacity duration-400 ease-out"
          style={{ opacity: showGlobalHUD ? 1 : 0 }}
        >
          <GlobalVignette intensity={isLightTheme ? 0.4 : 0.8} light={isLightTheme} />
          <GradientMaskTop intensity={isLightTheme ? 0.5 : 0.75} heightPercent={22} zIndex={15} light={isLightTheme} />
          <GradientMaskBottom intensity={isLightTheme ? 0.5 : 0.75} heightPercent={38} zIndex={20} light={isLightTheme} />
        </div>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden relative z-10"
      >
        {children}
      </main>

      {/* Global Radio Mini Player */}
      {!isPublicPreview && (
        <AnimatePresence>
          {showGlobalHUD && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] left-4 right-4 z-50 pointer-events-none"
            >
              <div className="pointer-events-auto">
                <Suspense fallback={null}>
                  <RadioMiniPlayer />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
