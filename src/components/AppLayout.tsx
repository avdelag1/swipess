import { lazy, Suspense } from 'react';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { GradientMaskTop, GradientMaskBottom, GlobalVignette } from '@/components/ui/GradientMasks';
import { RadioMiniPlayer } from '@/components/RadioMiniPlayer';
import { useTheme } from '@/hooks/useTheme';

// Lazy-load VisualEngine so framer-motion is NOT on the critical path
const VisualEngine = lazy(() =>
  import('@/visual/VisualEngine').then(m => ({ default: m.VisualEngine }))
);

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === 'white-matte';

  // Initialize app features
  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();

  // View Transitions API disabled in favor of Framer Motion AnimatedOutlet

  return (
    <div className="min-h-screen min-h-dvh w-full bg-background overflow-x-hidden">
      <SkipToMainContent />

      {/* Lazy-loaded visual engine - does not block first paint */}
      <Suspense fallback={null}>
        <VisualEngine />
      </Suspense>

      {/* Cinematic depth layers - standard dark masks invert to beautiful light masks in white-matte */}
      <GlobalVignette intensity={0.8} />
      <GradientMaskTop intensity={0.75} heightPercent={22} zIndex={15} />
      <GradientMaskBottom intensity={0.75} heightPercent={38} zIndex={20} />

      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden"
      >
        {children}
      </main>

      {/* Global Radio Mini Player - accessible everywhere including landing page */}
      <RadioMiniPlayer />
    </div>
  );
}
