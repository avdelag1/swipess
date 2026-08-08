import { lazy, Suspense, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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

function isDashboardRoute(pathname: string): boolean {
  if (pathname === '/client/dashboard' || pathname.startsWith('/client/dashboard/')) return true;
  if (pathname === '/owner/dashboard' || pathname.startsWith('/owner/dashboard/')) return true;
  return false;
}

export function PersistentDashboardScene() {
  const location = useLocation();

  const isDashboard = isDashboardRoute(location.pathname);
  const clientMountedRef = useRef(isDashboard);
  if (isDashboard) clientMountedRef.current = true;

  useEffect(() => {
    // no-op; presence of this hook keeps location reactivity alive
  }, [location.pathname]);

  return (
    <div
      aria-hidden={!isDashboard}
      className="absolute inset-0 flex flex-col"
      style={{
        zIndex: 0,
        display: isDashboard ? 'flex' : 'none',
        pointerEvents: isDashboard ? 'auto' : 'none',
        background: 'var(--dash-bg, hsl(var(--background)))',
      }}
    >
      {clientMountedRef.current && (
        <div
          className="absolute inset-0 flex flex-col flex-1 min-h-0 h-full w-full z-[1]"
          style={{ display: isDashboard ? 'flex' : 'none' }}
        >
          <Suspense fallback={null}>
            <ClientDashboard />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default PersistentDashboardScene;
