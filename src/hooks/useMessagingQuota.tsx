import { useState, useEffect } from 'react';
import { useUserSubscription } from './useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

type PlanLimits = {
  messages_per_month: number;
  unlimited_messages: boolean;
};

// ALL PLANS NOW HAVE UNLIMITED MESSAGING
const PLAN_LIMITS: Record<string, PlanLimits> = {
  'free': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM CLIENT': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM ++ CLIENT': { messages_per_month: 0, unlimited_messages: true },
  'UNLIMITED CLIENT': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM + OWNER': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM ++ OWNER': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM MAX OWNER': { messages_per_month: 0, unlimited_messages: true },
  'UNLIMITED OWNER': { messages_per_month: 0, unlimited_messages: true },
};

export function useMessagingQuota() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription();
  const queryClient = useQueryClient();
  
  // Get token balance from tokens table
  const { data: tokenData } = useQuery({
    queryKey: ['user-tokens', user?.id],
    queryFn: async () => {
      if (!user?.id) return { amount: 0, token_type: null };
      
      const { data, error } = await (supabase as any)
        .from('tokens')
        .select('amount, token_type, source')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        logger.error('[useMessagingQuota] Error fetching tokens:', error);
        return { amount: 0, token_type: null };
      }
      
      return data || { amount: 0, token_type: null };
    },
    enabled: !!user?.id,
  });
  
  const tokenBalance = tokenData?.amount || 0;
  const tokenType = tokenData?.token_type || null;
  
  // Check free messaging matches - query conversations directly
  const { data: freeMessagingCount = 0, isLoading: loadingMatches } = useQuery({
    queryKey: ['free-messaging-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
        .eq('free_messaging', true);
      
      if (error) {
        logger.error('[useMessagingQuota] Error fetching free messaging:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id,
  });
  
  const planName = subscription?.subscription_packages?.name || 'free';
  const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['free'];
  
  // Count CONVERSATIONS STARTED this month directly from conversations table
  const { data: conversationsStarted = 0 } = useQuery({
    queryKey: ['conversations-started-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Get conversations where this user is a participant, created this month
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, client_id, owner_id')
        .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
        .gte('created_at', startOfMonth.toISOString());
      
      if (error) {
        logger.error('[useMessagingQuota] Error fetching conversations count:', error);
        return 0;
      }
      
      if (!conversations || conversations.length === 0) return 0;

      // Get first messages to determine who started each conversation
      const conversationIds = conversations.map(c => c.id);
      
      const { data: firstMessages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('conversation_id, sender_id, created_at')
        .in('conversation_id', conversationIds)
        .order('conversation_id')
        .order('created_at', { ascending: true });

      if (msgError) {
        logger.error('[useMessagingQuota] Error fetching first messages:', msgError);
        return 0;
      }

      // Group by conversation_id and get the first message sender
      const firstMessageByConversation = new Map<string, string>();
      for (const msg of firstMessages || []) {
        if (!firstMessageByConversation.has(msg.conversation_id)) {
          firstMessageByConversation.set(msg.conversation_id, msg.sender_id);
        }
      }

      // Count how many conversations this user started
      let count = 0;
      for (const [_convId, senderId] of firstMessageByConversation) {
        if (senderId === user.id) {
          count++;
        }
      }

      return count;
    },
    enabled: !!user?.id,
  });
  
  const isUnlimited = limits.unlimited_messages;
  const totalAllowed = limits.messages_per_month;
  const remainingConversations = isUnlimited ? 999999 : Math.max(0, totalAllowed - conversationsStarted);
  const canStartNewConversation = isUnlimited || remainingConversations > 0;
  
  const decrementConversationCount = () => {
    queryClient.invalidateQueries({ queryKey: ['conversations-started-count', user?.id] });
  };
  
  const refreshQuota = () => {
    queryClient.invalidateQueries({ queryKey: ['conversations-started-count', user?.id] });
  };
  
  return {
    remainingConversations,
    conversationsStartedThisMonth: conversationsStarted,
    totalAllowed,
    canStartNewConversation,
    canSendMessage: true,
    isUnlimited,
    currentPlan: planName,
    hasFreeMessagingMatches: freeMessagingCount > 0,
    freeMessagingMatchCount: freeMessagingCount,
    decrementConversationCount,
    refreshQuota,
    tokenBalance,
    tokenType,
  };
}
