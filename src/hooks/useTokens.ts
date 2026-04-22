import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useTokens() {
  const { user } = useAuth();

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalRemaining: 999 };

      try {
        const { data, error } = await supabase
          .from('message_activations')
          .select('*')
          .eq('user_id', user.id);

        if (error || !data || data.length === 0) {
          return { totalRemaining: 999 };
        }

        const totalRemaining = data.reduce(
          (sum: number, row) => sum + (row.activations_remaining || 0),
          0
        );

        return { totalRemaining: totalRemaining > 0 ? totalRemaining : 999 };
      } catch {
        return { totalRemaining: 999 };
      }
    },
    enabled: !!user?.id,
  });

  return {
    tokens: tokens?.totalRemaining ?? 999,
    isLoading,
  };
}


