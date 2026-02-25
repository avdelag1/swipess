import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useMemo, useRef, useLayoutEffect } from 'react';
import { SkipToMainContent, useFocusManagement } from './AccessibilityHelpers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useViewTransitions } from '@/hooks/useViewTransitions';
import { useResponsiveContext } from '@/contexts/ResponsiveContext';
import { GradientMaskTop, GradientMaskBottom } from '@/components/ui/GradientMasks';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Route depth mapping for smart navigation transitions
const routeDepthMap: Record<string, number> = {
  '/': 0,
  '/client/dashboard': 1,
  '/owner/dashboard': 1,
  '/messages': 2,
  '/notifications': 2,
  '/client/profile': 2,
  '/owner/profile': 2,
  '/client/liked-properties': 2,
  '/owner/liked-clients': 2,
  '/owner/properties': 2,
  '/client/settings': 3,
  '/owner/settings': 3,
  '/client/security': 3,
  '/owner/security': 3,
  '/client/saved-searches': 3,
  '/owner/saved-searches': 3,
  '/subscription-packages': 3,
  '/client/contracts': 3,
  '/owner/contracts': 3,
  '/client/camera': 3,
  '/owner/camera': 3,
  '/owner/camera/listing': 4,
  '/client/services': 2,
  '/owner/clients/property': 2,
  '/owner/clients/moto': 2,
  '/owner/clients/bicycle': 2,
  '/owner/filters-explore': 3,
  '/owner/listings/new': 3,
};

function getRouteDepth(path: string): number {
  // Check exact match first
  if (routeDepthMap[path] !== undefined) {
    return routeDepthMap[path];
  }

  // Handle dynamic routes (e.g., /owner/view-client/:id, /profile/:id)
  if (path.startsWith('/owner/view-client/')) return 3;
  if (path.startsWith('/profile/')) return 1;
  if (path.startsWith('/listing/')) return 1;
  if (path.startsWith('/payment/')) return 2;

  // Default depth based on path segments
  return Math.min(path.split('/').filter(Boolean).length, 3);
}

/**
 * Ultra-fast iOS-style navigation transitions
 * Lightning fast with zero perceptible delay
 * - Forward: Instant slide from right
 * - Back: Instant slide to right
 * - Same level: Instant cross-fade
 */
function getTransitionVariant(fromPath: string, toPath: string) {
  const fromDepth = getRouteDepth(fromPath);
  const toDepth = getRouteDepth(toPath);

  // Minimal slide for speed - just enough to convey direction
  const slideAmount = 20;

  if (toDepth > fromDepth) {
    // Going deeper (forward navigation) - instant push
    return {
      initial: { opacity: 0, x: slideAmount },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -slideAmount / 3 },
    };
  }

  if (toDepth < fromDepth) {
    // Going back (backward navigation) - instant pop
    return {
      initial: { opacity: 0, x: -slideAmount / 3 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: slideAmount },
    };
  }

  // Same level navigation - instant cross-fade
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
}

/**
 * SPEED OF LIGHT: Get a STABLE key for dashboard routes
 *
 * The critical fix: Mode switching between /client/* and /owner/* should NOT
 * cause a full remount. We use a stable key "dashboard" for all protected routes
 * so the PersistentDashboardLayout stays mounted during mode switches.
 *
 * This is the Tinder/Instagram pattern - navigation swaps CONTENT, not SCREENS.
 */
function getStableRouteKey(pathname: string): string {
  // All dashboard routes (client or owner) share the same stable key
  // This prevents remount when switching modes
  if (pathname.startsWith('/client/') || pathname.startsWith('/owner/')) {
    return 'dashboard-layout';
  }

  // Shared protected routes also use stable key
  if (pathname === '/messages' || pathname === '/notifications' || pathname === '/subscription-packages') {
    return 'dashboard-layout';
  }

  // Public/unprotected routes use their pathname for proper transitions
  return pathname;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  // Get responsive state for adaptive behavior
  const responsive = useResponsiveContext();

  // Initialize app features
  useKeyboardShortcuts();
  useFocusManagement();
  useOfflineDetection();
  useErrorReporting();

  // Enable View Transitions API
  useViewTransitions();

  // SPEED OF LIGHT: Use stable key for dashboard routes to prevent remount
  const routeKey = useMemo(() => getStableRouteKey(location.pathname), [location.pathname]);
  const prevRouteKey = useRef(routeKey);

  // Only animate when the STABLE key changes (not on every pathname change)
  const shouldAnimate = routeKey !== prevRouteKey.current;

  // Get dynamic transition variant based on navigation direction
  // Use ref to get prev location synchronously before it updates
  const transitionVariant = useMemo(() => {
    // Skip animation for same-key transitions (mode switches within dashboard)
    if (!shouldAnimate) {
      return {
        initial: false as const,
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 1, x: 0 },
      };
    }
    const variant = getTransitionVariant(prevLocationRef.current, location.pathname);
    return variant;
  }, [location.pathname, shouldAnimate]);

  // Update previous location synchronously using useLayoutEffect
  // This ensures the ref is updated before the next render calculation
  useLayoutEffect(() => {
    // Update refs immediately for next calculation
    prevLocationRef.current = location.pathname;
    prevRouteKey.current = routeKey;
  }, [location.pathname, routeKey]);

  // Ultra-fast transition - imperceptible delay
  const fastTransition = {
    duration: shouldAnimate ? (responsive.isMobile ? 0.08 : 0.1) : 0,
    ease: [0.25, 0.8, 0.25, 1] as const, // Ultra-snappy easing
  };

  return (
    <div className="min-h-screen min-h-dvh w-full bg-background overflow-x-hidden">
      <SkipToMainContent />
      
      {/* PERSISTENT GRADIENT OVERLAYS - Curved screen effect across all pages */}
      <GradientMaskTop intensity={0.9} zIndex={9998} />
      <GradientMaskBottom intensity={0.85} zIndex={9997} />
      
      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none w-full min-h-screen min-h-dvh overflow-x-hidden"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={routeKey}
            initial={transitionVariant.initial}
            animate={transitionVariant.animate}
            exit={transitionVariant.exit}
            transition={fastTransition}
            className="w-full min-h-screen min-h-dvh overflow-x-hidden"
            style={{
              willChange: shouldAnimate ? 'opacity, transform' : 'auto',
              transformOrigin: 'center center',
              // GPU acceleration for smooth slide
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            layout={false}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
