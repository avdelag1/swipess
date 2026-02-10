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

      // Count likes received from owners (using unified likes table)
      // Must filter by direction='like' to exclude dismissals
      const { count: likesReceived } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', user.id)
        .eq('target_type', 'profile')
        .eq('direction', 'like');

      // Count mutual matches (using client_id/owner_id columns)
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`);

      // Count active conversations
      const { count: activeChats } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .eq('status', 'active');

      return {
        likesReceived: likesReceived || 0,
        matchesCount: matchesCount || 0,
        activeChats: activeChats || 0,
      };
    },
  });
}
