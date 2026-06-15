import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { fetchTokenBalance } from '@/utils/messagingEntitlements';

export function useTokens() {
  const { user } = useAuth();

  const { data: totalRemaining = 0, isLoading } = useQuery({
    queryKey: ['user-tokens', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return fetchTokenBalance(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return {
    tokens: totalRemaining,
    isLoading,
  };
}