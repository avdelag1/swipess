import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for admin-only pages.
 * Validates admin role server-side via Supabase RPC before rendering children.
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        if (cancelled) return;
        if (!data) {
          navigate("/client/dashboard", { replace: true });
          return;
        }
        setIsAdmin(true);
      } catch {
        if (!cancelled) {
          navigate("/client/dashboard", { replace: true });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkAdmin();
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}


