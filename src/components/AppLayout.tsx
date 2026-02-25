import { lazy, Suspense } from 'react';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { GradientMaskTop, GradientMaskBottom } from '@/components/ui/GradientMasks';

// Lazy-load VisualEngine so framer-motion is NOT on the critical path
const VisualEngine = lazy(() =>
  import('@/visual/VisualEngine').then(m => ({ default: m.VisualEngine }))
);

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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

      {/* Dark edge shading from top and bottom - cinematic screen feel */}
      <GradientMaskTop intensity={0.75} heightPercent={22} zIndex={15} />
      <GradientMaskBottom intensity={0.75} heightPercent={38} zIndex={20} />

      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden"
      >
        {children}
      </main>
    </div>
  );
}
