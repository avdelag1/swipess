import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import LegendaryLandingPage from "@/components/LegendaryLandingPage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
      if (!user) return null;
      logger.log("[Index] Fetching role for user:", user.id);
      
      // First try to fetch existing role
      const { data: existingRole, error: fetchError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        logger.error("[Index] Role fetch error:", fetchError);
        // Don't throw - try to create role as fallback
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
          logger.error("[Index] Role insert error:", insertError);
        } else {
          logger.log("[Index] Role created successfully:", metadataRole);
          return metadataRole;
        }
      }

      // Last resort: default to 'client'
      logger.log("[Index] No role found, defaulting to 'client'");
      return 'client';
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
    if (hasNavigated.current) return;
    if (!initialized) return; // Wait for auth to initialize
    if (loading) return;

    // Not logged in - show landing page
    if (!user) return;

    // PRIORITY 1: For new users, use metadata role immediately (don't wait for DB query)
    // This prevents the loading screen hang after signup
    if (isNewUser && !userRole) {
      const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
      if (metadataRole) {
        hasNavigated.current = true;
        const targetPath = metadataRole === "client" ? "/client/dashboard" : "/owner/dashboard";
        logger.log("[Index] New user - using metadata role, navigating to:", targetPath);
        navigate(targetPath, { replace: true });
        return;
      }
    }

    // PRIORITY 2: Have role from DB - navigate immediately
    if (userRole) {
      hasNavigated.current = true;
      const targetPath = userRole === "client" ? "/client/dashboard" : "/owner/dashboard";
      logger.log("[Index] Navigating to:", targetPath);
      navigate(targetPath, { replace: true });
      return;
    }

    // PRIORITY 3: If not new user and role query failed after timeout, try metadata as last resort
    if (!isNewUser && !userRole && !isLoadingRole) {
      const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
      if (metadataRole) {
        hasNavigated.current = true;
        const targetPath = metadataRole === "client" ? "/client/dashboard" : "/owner/dashboard";
        logger.log("[Index] Fallback - using metadata role, navigating to:", targetPath);
        navigate(targetPath, { replace: true });
        return;
      }
    }
  }, [user, userRole, loading, initialized, isLoadingRole, isNewUser, navigate]);

  // Reset navigation flag when user changes
  useEffect(() => {
    if (!user) {
      hasNavigated.current = false;
    }
  }, [user?.id]);

  // CRITICAL: Show loading spinner while auth is initializing
  // This prevents the landing page from flashing before redirecting to dashboard
  if (!initialized || loading) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // User exists but still loading role - show loading
  // But if polling has timed out (user age > 30s) and still no role, show error
  if (user && (isLoadingRole || (isNewUser && !userRole))) {
    // If user is too old and still no role, something went wrong
    if (userAgeMs > 30000 && !userRole && !isLoadingRole) {
      return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
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

    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
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
  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );
};

export default Index;
