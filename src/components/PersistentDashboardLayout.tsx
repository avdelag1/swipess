import { lazyWithRetry } from '@/utils/lazyRetry';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useMemo, useEffect, Suspense } from 'react';
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';
import { PersistentDashboardScene } from '@/components/dashboard/PersistentDashboardScene';

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

  return (
    <ChunkErrorBoundary>
    <DashboardLayout userRole={userRole}>
      <div
        id="swipess-dashboard-root"
        className="flex min-h-full w-full flex-1 flex-col relative"
      >
        {/* Persistent dashboard layer — mounted once, hidden via CSS on
            non-dashboard routes. Sits BELOW the outlet (z-0). */}
        <PersistentDashboardScene />
        {/* Outlet renders other routes ON TOP of the persistent dashboard
            (z-10). On /client/dashboard and /owner/dashboard the outlet
            renders an empty placeholder so the persistent layer shows.
            pointer-events:none on the wrapper so an empty outlet doesn't
            steal swipe gestures from the persistent dashboard underneath;
            AnimatedOutlet re-enables pointer-events on its inner motion
            container for non-dashboard routes. */}
        <div
          className="relative flex-1 flex flex-col"
          style={{ zIndex: 10, pointerEvents: 'none' }}
        >
          <AnimatedOutlet />
        </div>
      </div>

      {/* GLOBAL BACKGROUND SUBSCRIPTIONS & MODALS */}
      <Suspense fallback={null}>
        <PersistentDashboardSubscriptions />
      </Suspense>
    </DashboardLayout>
    </ChunkErrorBoundary>
  );
}

export default PersistentDashboardLayout;


