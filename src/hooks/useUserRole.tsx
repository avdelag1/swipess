import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * SPEED OF LIGHT: User role hook with aggressive caching
 *
 * Key optimizations:
 * - staleTime: 30 minutes (role rarely changes)
 * - gcTime: 60 minutes (keep in cache even when unmounted)
 * - refetchOnMount: false (never refetch on navigation)
 * - refetchOnWindowFocus: false (don't refetch when user returns)
 *
 * This prevents flicker on navigation by ensuring role is always
 * available from cache after first fetch.
 */
export function useUserRole(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.role as 'client' | 'owner' | 'admin' | null;
    },
    enabled: !!userId,
    // SECURITY: Reduced staleTime to ensure role changes are reflected quickly
    // when admin changes user roles or user changes their own role
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 30 for faster updates)
    gcTime: 15 * 60 * 1000, // 15 minutes (keep in cache for navigation)
    refetchOnMount: true, // Refetch on mount to catch role changes
    refetchOnWindowFocus: true, // Refetch when user returns to window
    refetchOnReconnect: true, // Refetch when reconnecting after offline
  });
}

// Note: For standalone getUserRole function, use the one from '@/utils/roleValidation'


