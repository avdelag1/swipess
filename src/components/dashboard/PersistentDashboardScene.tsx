import { lazy, Suspense, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveMode } from '@/hooks/useActiveMode';

/**
 * 🚀 PERSISTENT DASHBOARD SCENE
 *
 * The client/owner dashboards are mounted ONCE here and never unmount as
 * long as the user stays inside the protected layout. When the user
 * navigates to a non-dashboard route (Filters, Profile, Liked, etc.) we
 * just hide this layer with `display: none` — the swipe deck, image
 * cache, and scroll position survive. Returning to /client/dashboard or
 * /owner/dashboard is a CSS toggle, not a remount.
 *
 * The corresponding route entries in App.tsx render a tiny placeholder
 * so the outlet stays empty on the dashboard route and this layer is
 * what the user sees.
 */

const ClientDashboard = lazy(() => import('@/pages/ClientDashboard'));
const EnhancedOwnerDashboard = lazy(() => import('@/pages/EnhancedOwnerDashboard'));

function isDashboardRoute(pathname: string): 'client' | 'owner' | null {
  if (pathname === '/client/dashboard' || pathname.startsWith('/client/dashboard/')) return 'client';
  if (pathname === '/owner/dashboard' || pathname.startsWith('/owner/dashboard/')) return 'owner';
  return null;
}

export function PersistentDashboardScene() {
  const location = useLocation();
  const { activeMode } = useActiveMode();

  // Track which dashboards have actually been visited so we don't pay
  // the chunk + render cost up front for both roles.
  const clientMountedRef = useRef(false);
  const ownerMountedRef = useRef(false);

  const dashboardRole = isDashboardRoute(location.pathname);
  if (dashboardRole === 'client') clientMountedRef.current = true;
  if (dashboardRole === 'owner') ownerMountedRef.current = true;
  // Pre-mount the active mode's dashboard the first time the user lands
  // anywhere in the protected layout, so the first navigation TO the
  // dashboard is instant.
  if (activeMode === 'client') clientMountedRef.current = true;
  if (activeMode === 'owner') ownerMountedRef.current = true;

  const showClient = dashboardRole === 'client';
  const showOwner = dashboardRole === 'owner';

  // When hidden, also block pointer-events and aria-hide. We keep React
  // state alive but make it inert.
  useEffect(() => {
    // no-op; presence of this hook keeps location reactivity alive
  }, [location.pathname]);

  return (
    <div
      aria-hidden={!showClient && !showOwner}
      className="absolute inset-0 flex flex-col"
      style={{
        // Below the outlet (z-10) so non-dashboard pages render on top.
        zIndex: 0,
        // Hidden when the URL is not a dashboard URL — use display:none
        // (not just visibility:hidden) so nothing inside can ever bleed
        // through a dialog or modal that opens above. React tree stays
        // mounted; CSS toggle keeps swipe state and image cache alive.
        display: showClient || showOwner ? 'flex' : 'none',
        pointerEvents: showClient || showOwner ? 'auto' : 'none',
      }}
    >
      {clientMountedRef.current && (
        <div
          className="absolute inset-0 flex flex-col"
          style={{ display: showClient ? 'flex' : 'none' }}
        >
          <Suspense fallback={null}>
            <ClientDashboard />
          </Suspense>
        </div>
      )}
      {ownerMountedRef.current && (
        <div
          className="absolute inset-0 flex flex-col"
          style={{ display: showOwner ? 'flex' : 'none' }}
        >
          <Suspense fallback={null}>
            <EnhancedOwnerDashboard />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default PersistentDashboardScene;
