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

export function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === 'light';
  const location = useLocation();
  // Full-screen public preview pages manage their own gradient/overlay system
  const isPublicPreview = location.pathname.startsWith('/listing/') || location.pathname.startsWith('/profile/');

  // Initialize app features
  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();

  // View Transitions API disabled in favor of Framer Motion AnimatedOutlet

  return (
    <div className="min-h-screen min-h-dvh w-full bg-background overflow-x-hidden">
      <SkipToMainContent />
      
      <Suspense fallback={null}>
        <NotificationSystem />
      </Suspense>

      {/* Lazy-loaded visual engine - does not block first paint */}
      <Suspense fallback={null}>
        <VisualEngine />
      </Suspense>

      {/* Cinematic depth layers - theme-aware. Skip on full-screen public preview pages. */}
      {!isPublicPreview && <GlobalVignette intensity={isLightTheme ? 0.4 : 0.8} light={isLightTheme} />}
      {!isPublicPreview && <GradientMaskTop intensity={isLightTheme ? 0.5 : 0.75} heightPercent={22} zIndex={15} light={isLightTheme} />}
      {!isPublicPreview && <GradientMaskBottom intensity={isLightTheme ? 0.5 : 0.75} heightPercent={38} zIndex={20} light={isLightTheme} />}

      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden"
      >
        {children}
      </main>

      {/* Global Radio Mini Player - skip on full-screen public preview pages */}
      {!isPublicPreview && (
        <Suspense fallback={null}>
          <RadioMiniPlayer />
        </Suspense>
      )}
      
    </div>
  );
}
