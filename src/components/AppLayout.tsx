import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { GradientMaskTop, GradientMaskBottom, GlobalVignette } from '@/components/ui/GradientMasks';
import { useTheme } from '@/hooks/useTheme';

// Lazy-load sub-components to reduce initial main-thread work
const VisualEngine = lazy(() =>
  import('@/visual/VisualEngine').then(m => ({ default: m.VisualEngine }))
);
const RadioMiniPlayer = lazy(() =>
  import('@/components/RadioMiniPlayer').then(m => ({ default: m.RadioMiniPlayer }))
);
const NotificationSystem = lazy(() =>
  import('@/components/NotificationSystem').then(m => ({ default: m.NotificationSystem }))
);

interface AppLayoutProps {
  children: React.ReactNode;
}

import { useFocusMode } from '@/hooks/useFocusMode';
import { motion, AnimatePresence } from 'framer-motion';

export function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === 'light';
  const location = useLocation();
  const { isFocused } = useFocusMode(11500); // Extended timeout (+4s) for more immersive experience

  // Initialize app features
  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();

  // Full-screen public preview pages manage their own gradient/overlay system
  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');

  return (
    <div className="min-h-screen min-h-dvh w-full bg-background overflow-x-hidden relative">
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>

      {/* Lazy-loaded visual engine - does not block first paint */}
      <Suspense fallback={null}>
        <VisualEngine />
      </Suspense>

      {/* Cinematic depth layers - theme-aware. Skip on full-screen public preview pages. */}
      {!isPublicPreview && (
        <motion.div 
          animate={{ 
            opacity: isFocused ? 0 : 1,
            filter: isFocused ? "blur(4px)" : "blur(0px)" 
          }}
          transition={{ 
            duration: isFocused ? 2.4 : 0.4, // BEAUTIFUL vanish, INSTANT return
            ease: isFocused ? [0.43, 0.13, 0.23, 0.96] : "backOut" 
          }}
          className="pointer-events-none"
        >
          <GlobalVignette intensity={isLightTheme ? 0.4 : 0.8} light={isLightTheme} />
          <GradientMaskTop intensity={isLightTheme ? 0.5 : 0.75} heightPercent={22} zIndex={15} light={isLightTheme} />
          <GradientMaskBottom intensity={isLightTheme ? 0.5 : 0.75} heightPercent={38} zIndex={20} light={isLightTheme} />
        </motion.div>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden relative z-10"
      >
        {children}
      </main>

      {/* Global Radio Mini Player - skip on full-screen public preview pages */}
      {!isPublicPreview && (
        <AnimatePresence>
          {!isFocused && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                filter: "blur(0px)"
              }}
              exit={{ 
                y: 20, 
                opacity: 0,
                filter: "blur(12px)"
              }}
              transition={{ 
                duration: isFocused ? 2.4 : 0.45,
                ease: isFocused ? [0.43, 0.13, 0.23, 0.96] : [0.22, 1, 0.36, 1] 
              }}
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
