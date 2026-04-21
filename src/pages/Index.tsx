import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/prodLogger";
import { STORAGE } from "@/constants/app";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { lazy, Suspense } from "react";
const LegendaryLandingPage = lazy(() => import("@/components/LegendaryLandingPage"));

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
    retry: 5,
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
      return 400; // Accelerated polling (800 -> 400)
    },
  });

  const isLoadingRole = (profileLoading || isFetching) && userRole === undefined;

  // 🚀 WARP-SPEED REDIRECTION: Jump into the app as fast as possible
  useEffect(() => {
    // 1. Initial Auth Check - must be initialized
    if (!initialized || hasNavigated.current) return;

    // 2. Landing Page: If no user, stay here (landing is already being shown)
    if (!user) {
      logger.log("[Index] No user - Staying on landing");
      return;
    }

    const performInstantNav = async () => {
      // 3. Deep Link Priority: If we have a returnTo, go there IMMEDIATELY
      const returnTo = searchParams.get('returnTo');
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
          hasNavigated.current = true;
          navigate(returnTo, { replace: true });
          return;
      }

      // 4. Sticky Mode Preference: Fastest path (LocalStorage)
      const cachedMode = localStorage.getItem(`NEXUS DISCOVERY_active_mode_${user.id}`);
      if (cachedMode === 'client' || cachedMode === 'owner') {
          hasNavigated.current = true;
          logger.log("[Index] Warp-Speed: Navigating to sticky mode", cachedMode);
          navigate(`/${cachedMode}/dashboard`, { replace: true });
          return;
      }

      // 5. Auth Metadata: Reliable second path (In-memory)
      const metadataRole = user.user_metadata?.role as 'client' | 'owner' | undefined;
      if (metadataRole) {
          hasNavigated.current = true;
          logger.log("[Index] Warp-Speed: Navigating to metadata role", metadataRole);
          navigate(`/${metadataRole}/dashboard`, { replace: true });
          return;
      }

      // 6. DB Role Fallback: If we have the role from the query, use it
      if (userRole === 'client' || userRole === 'owner') {
          hasNavigated.current = true;
          logger.log("[Index] Warp-Speed: Navigating to DB role", userRole);
          navigate(`/${userRole}/dashboard`, { replace: true });
          return;
      }
      
      if (userRole === 'admin') {
          hasNavigated.current = true;
          navigate('/admin/eventos', { replace: true });
          return;
      }

      // 7. Last Resort: Default to client dashboard (Never block the user)
      if (!isLoadingRole && !isFetching) {
          hasNavigated.current = true;
          logger.warn("[Index] Warp-Speed: Last resort navigation to /client");
          navigate('/client/dashboard', { replace: true });
      }
    };

    // Safety net: Force navigation after max 1.5s (reduced from 3s)
    const safetyTimer = setTimeout(() => {
      if (!hasNavigated.current && user) {
        hasNavigated.current = true;
        logger.warn("[Index] Safety timeout — forcing dashboard entry");
        navigate('/client/dashboard', { replace: true });
      }
    }, 1500);

    performInstantNav();
    return () => clearTimeout(safetyTimer);
  }, [user, userRole, initialized, isLoadingRole, isFetching, navigate, searchParams]);

  // Reset navigation flag when user changes
  useEffect(() => {
    if (!user) {
      hasNavigated.current = false;
      setShowEscapeHatch(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Escape hatch: show a recovery UI if loading is stuck beyond 6 seconds
  useEffect(() => {
    if (!user || !initialized) return;
    const timer = setTimeout(() => setShowEscapeHatch(true), 4000);
    return () => clearTimeout(timer);
   
  }, [user, initialized]);

  if (!initialized || loading) {
    return <SuspenseFallback />;
  }

  // User exists but still loading role/redirection
  if (user && (isLoadingRole || (isNewUser && !userRole) || !hasNavigated.current)) {
    return (
      <>
        <SuspenseFallback />
        
        {showEscapeHatch && (
          <div 
            className="fixed bottom-12 left-0 right-0 z-[10000] flex justify-center px-6"
            style={{ animation: 'fadeSlideUp 0.4s ease-out forwards' }}
          >
            <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div className="bg-card/80 backdrop-blur-xl border border-border p-5 rounded-2xl shadow-2xl max-w-sm text-center">
              <p className="text-foreground font-medium text-sm mb-3">Taking longer than usual...</p>
              <button
                onClick={() => { window.location.href = '/?clear-cache=1'; }}
                className="w-full py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-primary/20 transition-transform active:scale-95"
              >
                Refresh Session
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <Suspense fallback={<SuspenseFallback />}>
          <LegendaryLandingPage />
        </Suspense>
      </div>
    );
  }

  // Final fallback while navigating
  return <SuspenseFallback />;
};

export default Index;

