import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OwnerInsights {
  total_listings: number;
  total_views: number;
  total_likes: number;
  total_matches: number;
  conversion_rate: number;
  active_conversations: number;
  revenue_projection: number;
  recent_activity: {
    event: string;
    count: number;
    date: string;
  }[];
}

export function useOwnerInsights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-insights', user?.id],
    queryFn: async (): Promise<OwnerInsights> => {
      if (!user) throw new Error('Not authenticated');

      // 1. Get listings count
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      // 2. Get likes received on owner listings
      // (This requires joining with listings table)
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('owner_id', user.id);
      
      const listingIds = listings?.map(l => l.id) || [];
      
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('target_id', listingIds);

      // 3. Get matches
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      // 4. Get active conversations
      const { count: convosCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('is_active', true);

      // Mocking some growth data for visuals
      const conversionRate = likesCount && matchesCount ? (matchesCount / likesCount) * 100 : 0;

      return {
        total_listings: listingsCount || 0,
        total_views: (likesCount || 0) * 3.2, // Simulated views (usually more than likes)
        total_likes: likesCount || 0,
        total_matches: matchesCount || 0,
        conversion_rate: parseFloat(conversionRate.toFixed(1)),
        active_conversations: convosCount || 0,
        revenue_projection: (matchesCount || 0) * 250, // Simulated revenue
        recent_activity: [
          { event: 'Likes', count: Math.floor(Math.random() * 20), date: '2026-04-10' },
          { event: 'Likes', count: Math.floor(Math.random() * 25), date: '2026-04-09' },
          { event: 'Likes', count: Math.floor(Math.random() * 15), date: '2026-04-08' },
        ]
      };
    },
    enabled: !!user,
  });
}

