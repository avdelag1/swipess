import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientStats {
  likesReceived: number; // Likes from owners
  matchesCount: number; // Mutual matches
  activeChats: number; // Active conversations
}

/**
 * Hook to fetch client statistics
 * - Likes received from property owners
 * - Total matches (mutual likes)
 * - Active chat conversations
 */
export function useClientStats() {
  const { user } = useAuth();

  return useQuery<ClientStats>({
    queryKey: ['client-stats', user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    queryFn: async () => {
      if (!user?.id) {
        return { likesReceived: 0, matchesCount: 0, activeChats: 0 };
      }

      // Fetch all stats concurrently to reduce network waterfall delay
      const [likesRes, matchesRes, chatsRes] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('target_id', user.id)
          .eq('target_type', 'profile')
          .eq('direction', 'right'),
        supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('status', 'active')
      ]);

      return {
        likesReceived: likesRes.count || 0,
        matchesCount: matchesRes.count || 0,
        activeChats: chatsRes.count || 0,
      };
    },
  });
}


