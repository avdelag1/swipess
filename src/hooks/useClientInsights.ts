import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ClientInsights {
  profiles_viewed: number;
  total_swipes: number;
  total_likes: number;
  total_matches: number;
  match_rate: number;
  tokens_earned: number;
  perks_unlocked: number;
  recent_activity: {
    event: string;
    count: number;
    date: string;
  }[];
}

export function useClientInsights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-insights', user?.id],
    queryFn: async (): Promise<ClientInsights> => {
      if (!user) throw new Error('Not authenticated');

      // 1. Get total swipes
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 2. Get matches
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 3. Get profile views (simulated or from a dedicated table if available)
      // For now, using likes count as a base
      const profilesViewed = (likesCount || 0) * 4.5;

      // 4. Tokens and Perks (Mocking from potential state/tables)
      const tokensEarned = 1250;
      const perksUnlocked = 12;

      const matchRate = likesCount && matchesCount ? (matchesCount / likesCount) * 100 : 0;

      return {
        profiles_viewed: Math.round(profilesViewed),
        total_swipes: (likesCount || 0) + (Math.round(profilesViewed * 0.8)), // likes + passes
        total_likes: likesCount || 0,
        total_matches: matchesCount || 0,
        match_rate: parseFloat(matchRate.toFixed(1)),
        tokens_earned: tokensEarned,
        perks_unlocked: perksUnlocked,
        recent_activity: [
          { event: 'Swipes', count: 42, date: '2026-04-10' },
          { event: 'Swipes', count: 35, date: '2026-04-09' },
          { event: 'Swipes', count: 51, date: '2026-04-08' },
          { event: 'Swipes', count: 28, date: '2026-04-07' },
          { event: 'Swipes', count: 45, date: '2026-04-06' },
          { event: 'Swipes', count: 39, date: '2026-04-05' },
          { event: 'Swipes', count: 55, date: '2026-04-04' },
        ]
      };
    },
    enabled: !!user,
  });
}
