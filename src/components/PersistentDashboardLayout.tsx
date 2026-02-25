import { Outlet, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useFilterPersistence } from '@/hooks/useFilterPersistence';
import { useMemo, useEffect } from 'react';

/**
 * SPEED OF LIGHT: Persistent Dashboard Layout
 *
 * This component wraps DashboardLayout and is mounted ONCE at the route level.
 * Child pages render inside via <Outlet>, so DashboardLayout never remounts
 * during navigation OR mode switches. This eliminates flicker and repeated effect execution.
 *
 * CRITICAL: This is now a UNIFIED layout for both client and owner routes.
 * The role is derived from the current path, NOT from props or async DB calls.
 * This ensures INSTANT role resolution with zero loading states.
 *
 * Benefits:
 * - No flicker when navigating between dashboard pages
 * - No remount when switching between client/owner modes
 * - TopBar and BottomNavigation stay mounted
 * - Dialogs/modals maintain state across navigation AND mode switches
 * - Effects (welcome, onboarding, prefetch) run only once
 */

/**
 * INSTANT role derivation from path
 * No async calls, no loading states, no flicker
 */
function getRoleFromPath(pathname: string): 'client' | 'owner' {
  if (pathname.startsWith('/owner/')) {
    return 'owner';
  }
  if (pathname.startsWith('/client/')) {
    return 'client';
  }
  // For shared routes (messages, notifications), use activeMode
  return 'client'; // Default, will be overridden by activeMode
}

export function PersistentDashboardLayout() {
  const location = useLocation();
  const { activeMode, syncMode } = useActiveMode();
  
  // FILTER PERSISTENCE: Auto-restore and auto-save filters from/to database
  useFilterPersistence();

  // SPEED OF LIGHT: Derive role from path INSTANTLY
  // No async calls, no loading states, no skeleton
  const userRole = useMemo(() => {
    const pathRole = getRoleFromPath(location.pathname);

    // For explicit client/owner routes, use the path
    if (location.pathname.startsWith('/client/') || location.pathname.startsWith('/owner/')) {
      return pathRole;
    }

    // For shared routes (messages, notifications, subscription), use activeMode
    return activeMode;
  }, [location.pathname, activeMode]);

  // Auto-sync activeMode when navigating to explicit client/owner routes
  // This ensures that shared routes (messages, notifications) use the correct mode
  useEffect(() => {
    if (location.pathname.startsWith('/client/') && activeMode !== 'client') {
      syncMode('client');
    } else if (location.pathname.startsWith('/owner/') && activeMode !== 'owner') {
      syncMode('owner');
    }
  }, [location.pathname, activeMode, syncMode]);

  return (
    <DashboardLayout userRole={userRole}>
      <Outlet />
    </DashboardLayout>
  );
}

export default PersistentDashboardLayout;
