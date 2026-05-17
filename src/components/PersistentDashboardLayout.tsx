import { useMemo, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActiveMode } from '@/hooks/useActiveMode';
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';
import { lazyWithRetry } from '@/utils/lazyRetry';

// 🚀 SPEED OF LIGHT: CORE COMPONENTS DECOUPLED
// We lazy-load these to break any potential circular dependency chains
// between the dashboard shell and the various hooks/contexts it consumes.
const DashboardLayout = lazyWithRetry(() => import('@/components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const AnimatedOutlet = lazyWithRetry(() => import('@/components/AnimatedOutlet').then(m => ({ default: m.AnimatedOutlet })));
const PersistentDashboardScene = lazyWithRetry(() => import('@/components/dashboard/PersistentDashboardScene').then(m => ({ default: m.PersistentDashboardScene })));

// Global match celebration and realtime subscriptions
const PersistentDashboardSubscriptions = lazyWithRetry(() => import('@/components/dashboard/PersistentDashboardSubscriptions').then(m => ({ default: m.PersistentDashboardSubscriptions })));

/**
 * SPEED OF LIGHT: Persistent Dashboard Layout
 * ... (existing doc)
 */

function getRoleFromPath(pathname: string, activeMode: 'client' | 'owner'): 'client' | 'owner' | 'admin' {
  if (pathname.startsWith('/admin/')) {
    return 'admin';
  }
  if (pathname.startsWith('/owner/')) {
    return 'owner';
  }
  if (pathname.startsWith('/client/')) {
    return 'client';
  }
  return activeMode;
}

export function PersistentDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMode, syncMode } = useActiveMode();

  // Realtime subscriptions and filter persistence are handled by
  // the dynamically loaded PersistentDashboardSubscriptions component
  // to avoid circular dependencies during initial module resolution.

  // SPEED OF LIGHT: Derive role from path INSTANTLY
  const userRole = useMemo(() => {
    const pathRole = getRoleFromPath(location.pathname, activeMode);
    if (location.pathname.startsWith('/admin/')) return 'admin' as const;
    if (location.pathname.startsWith('/client/') || location.pathname.startsWith('/owner/')) return pathRole;
    return activeMode;
  }, [location.pathname, activeMode]);

  // Auto-sync activeMode
  useEffect(() => {
    if (location.pathname.startsWith('/client/') && activeMode !== 'client') {
      syncMode('client');
    } else if (location.pathname.startsWith('/owner/') && activeMode !== 'owner') {
      syncMode('owner');
    }
  }, [location.pathname, activeMode, syncMode]);

  // Pointer-events on the outlet wrapper must be `none` on dashboard routes
  // (so the empty outlet doesn't steal swipe gestures from the persistent
  // dashboard underneath) but `auto` on every other route (so scrolling,
  // taps, and form interaction work normally). Previously this was hard-
  // coded to `none`, which broke scrolling on profile/settings/etc.
  const isDashboardRoute =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/');

  return (
    <ChunkErrorBoundary>
      <Suspense fallback={null}>
        <DashboardLayout userRole={userRole}>
          <div
            id="swipess-dashboard-root"
            className="flex min-h-full w-full flex-1 flex-col relative"
          >
            {/* Persistent dashboard layer — mounted once, hidden via CSS on
                non-dashboard routes. Sits BELOW the outlet (z-0). */}
            <Suspense fallback={null}>
              <PersistentDashboardScene />
            </Suspense>
            {/* Outlet renders other routes ON TOP of the persistent dashboard
                (z-10). On /client/dashboard and /owner/dashboard the outlet
                renders an empty placeholder so the persistent layer shows.
                pointer-events:none on the wrapper so an empty outlet doesn't
                steal swipe gestures from the persistent dashboard underneath;
                AnimatedOutlet re-enables pointer-events on its inner motion
                container for non-dashboard routes. */}
            <div
              className="relative flex-1 flex flex-col"
              style={{ zIndex: 10, pointerEvents: isDashboardRoute ? 'none' : 'auto' }}
            >
              <Suspense fallback={null}>
                <AnimatedOutlet />
              </Suspense>
            </div>
          </div>

          {/* GLOBAL BACKGROUND SUBSCRIPTIONS & MODALS */}
          <Suspense fallback={null}>
            <PersistentDashboardSubscriptions />
          </Suspense>
        </DashboardLayout>
      </Suspense>
    </ChunkErrorBoundary>
  );
}

export default PersistentDashboardLayout;


