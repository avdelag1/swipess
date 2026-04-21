import { lazyWithRetry } from '@/utils/lazyRetry';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useFilterPersistence } from '@/hooks/useFilterPersistence';
import { useMemo, useEffect, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useMatchRealtime } from '@/hooks/useMatchRealtime';
import { useLikesRealtime } from '@/hooks/useLikesRealtime';
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';

// Global match celebration modal
const MatchCelebration = lazyWithRetry(() => import('./MatchCelebration').then(m => ({ default: m.MatchCelebration })));

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

  // 🚀 SPEED OF LIGHT: Defer background systems until after the dashboard is 'Stable'
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsWarmedUp(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // FILTER PERSISTENCE: Auto-restore and auto-save filters from/to database
  useFilterPersistence();

  // GLOBAL MATCH CELEBRATION: Real-time listener for match events across the entire dashboard
  const { matchCelebration, closeCelebration } = useMatchRealtime(isWarmedUp);

  // GLOBAL LIKES SYNC: Ensures saves and favorites stay in sync across tabs and devices
  useLikesRealtime(isWarmedUp);

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
        id="zenith-dashboard-root"
        className="flex h-full min-h-0 w-full flex-1 flex-col"
        style={location.pathname.startsWith('/radio')
          ? undefined
          : { contentVisibility: 'auto', containIntrinsicSize: '1000px' }}
      >
        <AnimatedOutlet />
      </div>

      {/* GLOBAL MODALS PORTAL */}
      {createPortal(
        <Suspense fallback={null}>
          <MatchCelebration
            isOpen={matchCelebration.isOpen}
            onClose={closeCelebration}
            matchedUser={{
              name: matchCelebration.matchedUser?.name || 'Someone',
              avatar: matchCelebration.matchedUser?.avatar,
              role: matchCelebration.matchedUser?.role || 'client'
            }}
            onMessage={() => {
              // Redirect to messages upon match interaction
              closeCelebration();
              navigate('/messages');
            }}
          />
        </Suspense>,
        document.body
      )}
    </DashboardLayout>
    </ChunkErrorBoundary>
  );
}

export default PersistentDashboardLayout;

