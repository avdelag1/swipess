import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import LegendaryLandingPage from "@/components/LegendaryLandingPage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/utils/prodLogger";
import { STORAGE } from "@/constants/app";

const Index = () => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasNavigated = useRef(false);

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
    error,
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
      const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
      if (metadataRole) {
        hasNavigated.current = true;
        const targetPath = metadataRole === "owner" ? "/owner/dashboard" : "/client/dashboard";
        logger.log("[Index] New user - using metadata role, navigating to:", targetPath);
        navigate(targetPath, { replace: true });
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

      // Try database
      const { data } = await supabase
        .from('profiles')
        .select('active_mode')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.active_mode === 'client' || data?.active_mode === 'owner') {
        logger.log("[Index] Sticky mode found in database:", data.active_mode);
        return data.active_mode as 'client' | 'owner';
      }

      return null;
    };

    // PRIORITY 3: Have role from DB or metadata - combine with sticky mode
    const performRedirection = async () => {
      if (hasNavigated.current) return;

      const activeMode = await fetchActiveMode();

      // If we have an active mode preference, use it
      if (activeMode) {
        hasNavigated.current = true;
        const targetPath = activeMode === 'owner' ? '/owner/dashboard' : '/client/dashboard';
        logger.log("[Index] Navigating to sticky active mode:", targetPath);
        navigate(targetPath, { replace: true });
        return;
      }

      // Fallback 1: Admin always goes to client (or sticky if they have one)
      if (userRole === 'admin') {
        hasNavigated.current = true;
        logger.log("[Index] Admin detected, navigating to client dashboard");
        navigate('/client/dashboard', { replace: true });
        return;
      }

      // Fallback 2: Primary role
      if (userRole) {
        hasNavigated.current = true;
        const targetPath = userRole === "owner" ? "/owner/dashboard" : "/client/dashboard";
        logger.log("[Index] Navigating to primary role dashboard:", targetPath);
        navigate(targetPath, { replace: true });
        return;
      }

      // Fallback 3: Metadata or Default
      if (!isNewUser && !isLoadingRole) {
        const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
        const targetPath = metadataRole === "owner" ? "/owner/dashboard" : "/client/dashboard";
        hasNavigated.current = true;
        logger.log("[Index] Last resort navigation to:", targetPath);
        navigate(targetPath, { replace: true });
      }
    };

    performRedirection();
  }, [user, userRole, loading, initialized, isLoadingRole, isNewUser, navigate]);

  // Reset navigation flag when user changes
  useEffect(() => {
    if (!user) {
      hasNavigated.current = false;
    }
  }, [user?.id]);

  if (!initialized || loading) {
    return <div className="min-h-screen min-h-dvh" style={{ background: '#050505' }} />;
  }

  // User exists but still loading role - show transparent screen
  if (user && (isLoadingRole || (isNewUser && !userRole))) {
    // If user is too old and still no role, something went wrong
    if (userAgeMs > 30000 && !userRole && !isLoadingRole) {
      return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center" style={{ background: '#050505' }}>
          <div className="text-center space-y-4 p-4 max-w-md">
            <div className="text-orange-500 text-4xl">⚠️</div>
            <h2 className="text-white text-lg font-semibold">Setup Taking Longer Than Expected</h2>
            <p className="text-white/70 text-sm">
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

    return <div className="min-h-screen min-h-dvh" style={{ background: '#050505' }} />;
  }

  // Solo muestra landing page si NO hay usuario logueado
  if (!user) {
    return (
      <div className="min-h-screen">
        <LegendaryLandingPage />
      </div>
    );
  }

  // Caso final (redirigiendo)
  return <div className="min-h-screen min-h-dvh" style={{ background: '#050505' }} />;
};

export default Index;
