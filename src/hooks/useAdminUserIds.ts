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
            // Fetch users with admin roles from profiles table
            // We use the profiles table directly as it's the source of truth for discovery
            const { data, error } = await supabase
                .from('profiles')
                .select('user_id')
                .or('role.ilike.%admin%');
            
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
