import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useMessageActivations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch available activations (pay-per-use + monthly + referral bonuses)
  const { data: activations, isLoading } = useQuery({
    queryKey: ['message-activations', user?.id],
    queryFn: async () => {
      if (!user?.id) return { payPerUse: [], monthly: [], referralBonus: [], totalRemaining: 0 };

      // Get active pay-per-use credits (not expired)
      const { data: payPerUse, error: payPerUseError } = await supabase
        .from('message_activations')
        .select('*')
        .eq('user_id', user.id)
        .eq('activation_type', 'pay_per_use')
        .gt('expires_at', new Date().toISOString())
        .gt('remaining_activations', 0)
        .order('expires_at', { ascending: true }); // Use oldest credits first

      if (payPerUseError) throw payPerUseError;

      // Get monthly subscription activations
      const { data: monthly, error: monthlyError } = await supabase
        .from('message_activations')
        .select('*')
        .eq('user_id', user.id)
        .eq('activation_type', 'monthly_subscription')
        .gte('reset_date', new Date().toISOString().split('T')[0])
        .gt('remaining_activations', 0);

      if (monthlyError) throw monthlyError;

      // Get referral bonus activations (not expired)
      const { data: referralBonus, error: referralError } = await supabase
        .from('message_activations')
        .select('*')
        .eq('user_id', user.id)
        .eq('activation_type', 'referral_bonus')
        .gt('expires_at', new Date().toISOString())
        .gt('remaining_activations', 0)
        .order('expires_at', { ascending: true }); // Use oldest credits first

      if (referralError) throw referralError;

      const totalRemaining = [
        ...(payPerUse || []),
        ...(monthly || []),
        ...(referralBonus || [])
      ].reduce((sum, act) => sum + (act.remaining_activations || 0), 0);

      return {
        payPerUse: payPerUse || [],
        monthly: monthly || [],
        referralBonus: referralBonus || [],
        totalRemaining
      };
    },
    enabled: !!user?.id,
  });
  
  // Use an activation (conversation start)
  const useActivation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Prioritize: referral bonus first (use free ones), then pay-per-use, then monthly
      const activation =
        activations?.referralBonus?.[0] ||
        activations?.payPerUse?.[0] ||
        activations?.monthly?.[0];

      if (!activation) throw new Error('No activations available');
      
      // Increment used_activations
      const { error: updateError } = await supabase
        .from('message_activations')
        .update({ used_activations: activation.used_activations + 1 })
        .eq('id', activation.id);
      
      if (updateError) throw updateError;
      
      // Log usage
      const { error: logError } = await supabase
        .from('activation_usage_log')
        .insert({
          user_id: user.id,
          activation_id: activation.id,
          conversation_id: conversationId,
          activation_context: 'new_conversation',
        });
      
      if (logError) throw logError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-activations'] });
    },
  });
  
  return {
    totalActivations: activations?.totalRemaining || 0,
    canSendMessage: (activations?.totalRemaining || 0) > 0,
    useActivation,
    isLoading,
    payPerUseCount: activations?.payPerUse?.length || 0,
    monthlyCount: activations?.monthly?.length || 0,
    referralBonusCount: activations?.referralBonus?.length || 0,
  };
}
