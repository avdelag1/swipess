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
    // SPEED OF LIGHT: Aggressive caching - role almost never changes
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes (keep in cache)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Note: For standalone getUserRole function, use the one from '@/utils/roleValidation'
