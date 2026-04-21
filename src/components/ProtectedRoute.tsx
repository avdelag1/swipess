import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

import { PremiumLoader } from "@/components/PremiumLoader";

/**
 * PRODUCTION-READY UNIFIED LOADER
 * Matches index.html splash exactly for a seamless transition
 */
function ProtectedRouteLoadingSkeleton() {
  // Return null — the index.html splash screen covers this period
  return null;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate]);

  // Reset navigation ref only when user comes back (not on every route change)
  // This prevents potential redirect loops during auth state changes
  useEffect(() => {
    if (user && didNavigateRef.current) {
      didNavigateRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // SPEED OF LIGHT: If we've shown content before, keep showing children
  // This prevents flicker during token refresh or transient auth state changes
  // CRITICAL: Must verify user still exists to avoid logout crashes
  if (hasShownContent && user) {
    return <>{children}</>;
  }

  // Show skeleton while auth is loading - prevents initial flash
  if (loading) return <ProtectedRouteLoadingSkeleton />;

  // Not logged in: show skeleton briefly (effect will redirect)
  if (!user) return <ProtectedRouteLoadingSkeleton />;

  return <>{children}</>;
}

