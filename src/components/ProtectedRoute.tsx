import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * iOS-grade loading skeleton for protected routes
 * Prevents flash/flicker during auth check by showing content structure
 */
function ProtectedRouteLoadingSkeleton() {
  return (
    <div
      className="min-h-screen min-h-dvh w-full bg-background flex flex-col"
      style={{
        paddingTop: 'calc(52px + var(--safe-top, 0px))',
        paddingBottom: 'calc(68px + var(--safe-bottom, 0px))',
      }}
    >
      {/* Top bar skeleton */}
      <div className="fixed top-0 left-0 right-0 h-[52px] bg-background border-b border-border/50 flex items-center justify-between px-4 z-50" style={{ paddingTop: 'var(--safe-top, 0px)' }}>
        <Skeleton className="h-8 w-24 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Main content skeleton - mimics swipe card layout */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden relative">
          <Skeleton className="absolute inset-0 rounded-3xl" />
          {/* Story dots */}
          <div className="absolute top-3 left-4 right-4 flex gap-1 z-10">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={`dot-${i}`} className="flex-1 h-1 rounded-full bg-white/20" />
            ))}
          </div>
          {/* Bottom sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-t-[24px] p-4 pt-6">
            <Skeleton className="w-10 h-1.5 mx-auto mb-3 rounded-full bg-white/30" />
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/15" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-6 w-20 bg-white/20" />
                <Skeleton className="h-3 w-12 ml-auto bg-white/15" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12 bg-white/15 rounded" />
              <Skeleton className="h-4 w-12 bg-white/15 rounded" />
              <Skeleton className="h-4 w-16 bg-white/15 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-[68px] bg-background border-t border-border/50 flex items-center justify-around px-4" style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={`nav-${i}`} className="h-10 w-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * SPEED OF LIGHT: Simplified ProtectedRoute
 *
 * This component ONLY handles authentication checking.
 * Role/mode handling is done by the unified PersistentDashboardLayout.
 *
 * Key optimizations:
 * - No activeMode dependency (prevents re-renders on mode switch)
 * - No role checking (layout derives role from path)
 * - Once content shown, never go back to skeleton
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const didNavigateRef = useRef(false);

  // SPEED OF LIGHT: Track if we've ever shown valid content
  // Once shown, NEVER go back to skeleton (prevents flicker on refresh)
  const [hasShownContent, setHasShownContent] = useState(false);

  // Mark that we've shown valid content once
  useEffect(() => {
    if (user && !loading) {
      setHasShownContent(true);
    }
  }, [user, loading]);

  useEffect(() => {
    // Prevent duplicate navigations
    if (didNavigateRef.current) return;

    // Wait for auth to stabilize
    if (loading) return;

    // Not authenticated -> redirect to home (login/landing)
    if (!user) {
      didNavigateRef.current = true;
      navigate("/", { replace: true, state: { from: location } });
      return;
    }
  }, [user, loading, navigate, location]);

  // Reset navigation ref only when user comes back (not on every route change)
  // This prevents potential redirect loops during auth state changes
  useEffect(() => {
    if (user && didNavigateRef.current) {
      didNavigateRef.current = false;
    }
  }, [user?.id]);

  // SPEED OF LIGHT: If we've shown content before, keep showing children
  // This prevents flicker during token refresh or re-renders
  if (hasShownContent && user) {
    return <>{children}</>;
  }

  // Show skeleton while auth is loading - prevents flash
  if (loading) return <ProtectedRouteLoadingSkeleton />;

  // Not logged in: show skeleton briefly (effect will redirect)
  if (!user) return <ProtectedRouteLoadingSkeleton />;

  return <>{children}</>;
}
