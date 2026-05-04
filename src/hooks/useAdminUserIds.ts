import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * SPEED OF LIGHT: Fetch all admin user IDs and cache them.
 * Used to exclude administrative accounts from discovery decks.
 * 
 * Supports both 'admin' and potential 'business_admin' variations.
 */
export function useAdminUserIds() {
    return useQuery({
        queryKey: ['admin-user-ids'],
        queryFn: async () => {
            // Source of truth for roles is the `user_roles` table, NOT profiles.role
            // (profiles.role is unreliable / often empty). Admins must NEVER appear
            // in any discovery deck or insights view.
            const { data, error } = await supabase
                .from('user_roles')
                .select('user_id, role')
                .eq('role', 'admin');

            if (error) {
                console.error('[useAdminUserIds] Error fetching admins:', error);
                return new Set<string>();
            }

            return new Set<string>((data || []).map(r => r.user_id));
        },
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
    });
}
