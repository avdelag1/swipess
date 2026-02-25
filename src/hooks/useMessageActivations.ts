import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useMessageActivations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available tokens from tokens table (renamed from message_activations)
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['message_activations', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalRemaining: 999 };

      try {
        const { data, error } = await (supabase as any)
          .from('tokens')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          return { totalRemaining: 999 };
        }

        if (!data || data.length === 0) {
          return { totalRemaining: 999 };
        }

        const totalRemaining = data.reduce((sum: number, act: any) => sum + (act.activations_remaining || 0), 0);

        return { totalRemaining: totalRemaining > 0 ? totalRemaining : 999 };
      } catch {
        return { totalRemaining: 999 };
      }
    },
    enabled: !!user?.id,
  });

  // Use a token (conversation start) - simplified
  const useActivation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      // No-op for now - messaging is free
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
  });

  return {
    totalActivations: tokens?.totalRemaining || 999,
    canSendMessage: true, // Always allow messaging for testing
    useActivation,
    isLoading,
    payPerUseCount: 0,
    monthlyCount: 0,
    referralBonusCount: 0,
  };
}
