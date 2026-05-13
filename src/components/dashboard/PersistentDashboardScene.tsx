import { lazy, Suspense, useEffect, useRef, Component, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveMode } from '@/hooks/useActiveMode';
import { logger } from '@/utils/prodLogger';
import { useFilterStore } from '@/state/filterStore';
import { useSwipeDeckStore } from '@/state/swipeDeckStore';

// ─── Dashboard-level error boundary ─────────────────────────────────────────
// ChunkErrorBoundary only catches chunk-load failures (returns null for other
// errors, so non-chunk runtime crashes propagate up to GlobalErrorBoundary and
// take down the entire app). This boundary catches EVERY error from the owner
// or client dashboard and shows a local recovery screen instead.
interface DashErrorState { hasError: boolean; error?: Error }
class DashboardErrorBoundary extends Component<{ role: string; children: ReactNode }, DashErrorState> {
  state: DashErrorState = { hasError: false };

  static getDerivedStateFromError(error: Error): DashErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    logger.error(`[DashboardErrorBoundary:${this.props.role}] caught`, error?.message, info?.componentStack?.slice(0, 400));
  }

  handleReset = () => {
    // Reset owner phase and clear deck state so the dashboard restarts cleanly
    try {
      useFilterStore.getState().setOwnerPhase('cards');
      useFilterStore.getState().setActiveCategory(null);
    } catch { /* ignore */ }
    try {
      // Clear all owner decks to force a fresh fetch
      const deckState = useSwipeDeckStore.getState();
      Object.keys(deckState.ownerDecks || {}).forEach(cat => {
        deckState.resetOwnerDeck(cat);
      });
    } catch { /* ignore */ }
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 p-8 text-center bg-black">
          <div className="w-14 h-14 rounded-[18px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-red-500/40 border-t-red-500 animate-spin" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <p className="text-white font-black text-base uppercase italic tracking-tight">Dashboard Error</p>
            <p className="text-white/40 text-xs leading-relaxed">
              {import.meta.env.DEV ? this.state.error?.message : 'An unexpected error occurred. Tap below to recover.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all"
          >
            Reset Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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
          <DashboardErrorBoundary role="client">
            <Suspense fallback={null}>
              <ClientDashboard />
            </Suspense>
          </DashboardErrorBoundary>
        </div>
      )}
      {ownerMountedRef.current && (
        <div
          className="absolute inset-0 flex flex-col"
          style={{ display: showOwner ? 'flex' : 'none' }}
        >
          <DashboardErrorBoundary role="owner">
            <Suspense fallback={null}>
              <EnhancedOwnerDashboard />
            </Suspense>
          </DashboardErrorBoundary>
        </div>
      )}
    </div>
  );
}

export default PersistentDashboardScene;
