import { Suspense, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActiveMode } from '@/hooks/useActiveMode';
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';

// Scene + subscriptions stay lazy — they are heavy and not needed for tab switches.
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
  const _navigate = useNavigate();
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
      <DashboardLayout userRole={userRole}>
          <div
            id="swipess-dashboard-root"
            className={cn(
              "w-full flex flex-col flex-grow relative",
              isDashboardRoute && "min-h-full self-stretch"
            )}
          >
            {/* Persistent dashboard layer — mounted once, hidden via CSS on
                non-dashboard routes. Sits BELOW the outlet (z-0). */}
            <Suspense fallback={null}>
              <PersistentDashboardScene />
            </Suspense>
            {/* Outlet renders other routes ON TOP of the persistent dashboard (z-10). */}
            <div
              className={cn(
                "relative w-full flex flex-col flex-grow",
                isDashboardRoute && "flex-1 min-h-0 pointer-events-none-force"
              )}
              style={{
                zIndex: 10,
              }}
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


