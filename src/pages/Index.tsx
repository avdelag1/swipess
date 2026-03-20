import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import LegendaryLandingPage from "@/components/LegendaryLandingPage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/prodLogger";
import { STORAGE } from "@/constants/app";

const Index = () => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasNavigated = useRef(false);
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);

  // Capture referral code from URL if present (works for app-wide referral links)
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && refCode.length > 0) {
      // Don't capture if it's the current user's own referral
      if (user?.id && user.id === refCode) return;

      // Store referral code with timestamp
      const referralData = {
        code: refCode,
        capturedAt: Date.now(),
        source: '/',
      };
      localStorage.setItem(STORAGE.REFERRAL_CODE_KEY, JSON.stringify(referralData));
    }
  }, [searchParams, user?.id]);

  const userAgeMs = useMemo(() => {
    if (!user?.created_at) return Infinity;
    return Date.now() - new Date(user.created_at).getTime();
  }, [user?.created_at]);

  const isNewUser = userAgeMs < 60000; // Less than 60 seconds since registration (increased from 30s)

  const {
    data: userRole,
    isLoading: profileLoading,
    isFetching,
    error: _error,
  } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      // Guard against null user or uninitialized auth
      if (!user?.id || !initialized) return null;

      logger.log("[Index] Fetching role for user:", user.id);

      try {
        // First try to fetch existing role
        const { data: existingRole, error: fetchError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) {
          logger.error("[Index] Role fetch error:", fetchError);
          // Return null to allow fallback logic in useEffect or query retry
          return null;
        }

        // If role exists, return it
        if (existingRole?.role) {
          logger.log("[Index] Role fetched successfully:", existingRole.role);
          return existingRole.role;
        }

        // Role doesn't exist - create it from metadata
        const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
        if (metadataRole) {
          logger.log("[Index] Creating role from metadata:", metadataRole);
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: user.id, role: metadataRole });

          if (insertError) {
            // Ignore duplicate key errors (code 23505)
            if (insertError.code !== '23505') {
              logger.error("[Index] Role insert error:", insertError);
            } else {
              return metadataRole;
            }
          } else {
            logger.log("[Index] Role created successfully:", metadataRole);
            return metadataRole;
          }
        }

        // Last resort: use metadata role or default to 'client'
        const fallbackRole = (user.user_metadata?.role as string) || 'client';
        logger.log("[Index] No role in DB, using fallback:", fallbackRole);
        return fallbackRole;
      } catch (err) {
        logger.error("[Index] Unexpected error in queryFn:", err);
        return null;
      }
    },
    enabled: !!user && initialized,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // Poll for role until we have one
    // Stop polling after 30 seconds (user age check)
    refetchInterval: (query) => {
      const role = query.state.data as string | null | undefined;
      if (!user || role) return false;
      if (userAgeMs > 30000) return false;
      return 800;
    },
  });

  const isLoadingRole = (profileLoading || isFetching) && userRole === undefined;

  // CRITICAL FIX: Navigate as soon as we have role, don't wait
  useEffect(() => {
    // CRITICAL: Complete wait for auth to initialize
    if (!initialized || loading || hasNavigated.current) return;

    // Not logged in - show landing page (return early, no navigation needed)
    if (!user) {
      logger.log("[Index] No user found, staying on landing page");
      return;
    }

    // From here on, we have a user and auth is initialized.

    // PRIORITY 1: For new users, use metadata role immediately (don't wait for DB query)
    // This prevents the loading screen hang after signup
    if (isNewUser) {
      const returnTo = searchParams.get('returnTo');
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        hasNavigated.current = true;
        navigate(returnTo, { replace: true });
        return;
      }
      const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
      if (metadataRole) {
        hasNavigated.current = true;
        logger.log("[Index] New user - navigating to unified hub");
        const target = metadataRole === 'owner' ? "/owner/dashboard" : "/client/dashboard";
        navigate(target, { replace: true });
        return;
      }
    }

    // PRIORITY 2: Check for active_mode preference (Sticky Mode)
    // We prioritize the user's last selected mode stored in DB or local storage
    const fetchActiveMode = async () => {
      // Try local storage first (fastest)
      const cachedMode = localStorage.getItem(`swipess_active_mode_${user.id}`);
      if (cachedMode === 'client' || cachedMode === 'owner') {
        logger.log("[Index] Sticky mode found in localStorage:", cachedMode);
        return cachedMode;
      }

      // Try database with a 3-second timeout to prevent getting stuck
      try {
        const dbPromise = supabase
          .from('profiles')
          .select('active_mode')
          .eq('user_id', user.id)
          .maybeSingle();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const result = await Promise.race([dbPromise, timeoutPromise]);

        if (result && 'data' in result && (result.data?.active_mode === 'client' || result.data?.active_mode === 'owner')) {
          logger.log("[Index] Sticky mode found in database:", result.data.active_mode);
          return result.data.active_mode as 'client' | 'owner';
        }
      } catch {
        logger.warn("[Index] fetchActiveMode DB query failed, skipping");
      }

      return null;
    };

    // PRIORITY 3: Have role from DB or metadata - combine with sticky mode
    const performRedirection = async () => {
      if (hasNavigated.current) return;

      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        hasNavigated.current = true;
        logger.log("[Index] Deep link detected, navigating to:", returnTo);
        navigate(returnTo, { replace: true });
        return;
      }

      // ADMIN GUARD: Check admin FIRST — admin users must never enter client/owner flow
      if (userRole === 'admin') {
        hasNavigated.current = true;
        logger.log("[Index] Admin detected (early guard), navigating to admin panel");
        navigate('/admin/eventos', { replace: true });
        return;
      }

      const activeMode = await fetchActiveMode();

      // If we have an active mode preference, use it
      if (activeMode) {
        hasNavigated.current = true;
        logger.log("[Index] Navigating to unified hub with sticky mode:", activeMode);
        const target = activeMode === 'owner' ? "/owner/dashboard" : "/client/dashboard";
        navigate(target, { replace: true });
        return;
      }

      // Fallback 1: Admin always goes to admin panel — never mixed with client/owner
      if (userRole === 'admin') {
        hasNavigated.current = true;
        logger.log("[Index] Admin detected, navigating to admin panel");
        navigate('/admin/eventos', { replace: true });
        return;
      }

      // Fallback 2: Primary role
      if (userRole) {
        hasNavigated.current = true;
        logger.log("[Index] Navigating to unified hub with role:", userRole);
        const target = userRole === 'owner' ? "/owner/dashboard" : "/client/dashboard";
        navigate(target, { replace: true });
        return;
      }

      // Fallback 3: Metadata or Default
      if (!isNewUser && !isLoadingRole) {
        hasNavigated.current = true;
        logger.log("[Index] Last resort navigation to unified hub");
        navigate("/client/dashboard", { replace: true });
        return;
      }

      // Unconditional last resort: never leave user on black screen
      // Fires when role query is in-flight AND user is new with no metadata role
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        logger.warn("[Index] Unconditional fallback navigation to unified hub");
        navigate("/client/dashboard", { replace: true });
      }
    };

    // Safety net: if performRedirection never fires navigation within 4s, force it
    // IMPORTANT: Do NOT clear this from performRedirection — it must run independently
    const safetyTimeout = setTimeout(() => {
      if (!hasNavigated.current && user) {
        hasNavigated.current = true;
        logger.warn("[Index] Safety timeout triggered — forcing navigation to unified hub");
        navigate("/client/dashboard", { replace: true });
      }
    }, 2000);

    performRedirection();
    return () => clearTimeout(safetyTimeout);
  }, [user, userRole, loading, initialized, isLoadingRole, isNewUser, navigate]);

  // Reset navigation flag when user changes
  useEffect(() => {
    if (!user) {
      hasNavigated.current = false;
      setShowEscapeHatch(false);
    }
  }, [user?.id]);

  // Escape hatch: show a recovery UI if loading is stuck beyond 6 seconds
  useEffect(() => {
    if (!user || !initialized) return;
    const timer = setTimeout(() => setShowEscapeHatch(true), 6000);
    return () => clearTimeout(timer);
  }, [user, initialized]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground/80 animate-spin" />
      </div>
    );
  }

  // User exists but still loading role - show transparent screen
  if (user && (isLoadingRole || (isNewUser && !userRole))) {
    // If user is too old and still no role, something went wrong
    if (userAgeMs > 30000 && !userRole && !isLoadingRole) {
      return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-4 max-w-md">
            <div className="text-orange-500 text-4xl">⚠️</div>
            <h2 className="text-foreground text-lg font-semibold">Setup Taking Longer Than Expected</h2>
            <p className="text-muted-foreground text-sm">
              Your account setup is taking longer than usual. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    if (showEscapeHatch) {
      return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-4 max-w-sm">
            <div className="text-orange-500 text-3xl">⏳</div>
            <h2 className="text-foreground text-base font-semibold">Taking longer than expected…</h2>
            <p className="text-muted-foreground text-sm">Your session may need a refresh to continue.</p>
            <button
              onClick={() => { window.location.href = '/?clear-cache=1'; }}
              className="mt-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm transition-colors"
            >
              Refresh & Continue
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground/80 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <LegendaryLandingPage />
      </div>
    );
  }

  // Caso final (redirigiendo)
  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-background">
      {showEscapeHatch ? (
        <div className="text-center space-y-4 p-4 max-w-sm">
          <div className="text-orange-500 text-3xl">⏳</div>
          <h2 className="text-foreground text-base font-semibold">Taking longer than expected…</h2>
          <p className="text-muted-foreground text-sm">Your session may need a refresh to continue.</p>
          <button
            onClick={() => { window.location.href = '/?clear-cache=1'; }}
            className="mt-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm transition-colors"
          >
            Refresh & Continue
          </button>
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground/80 animate-spin" />
      )}
    </div>
  );
};

export default Index;
