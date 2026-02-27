import { useState, useEffect } from 'react';
import { useUserSubscription } from './useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/prodLogger';

type PlanLimits = {
  messages_per_month: number;
  unlimited_messages: boolean;
};

// This tracks CONVERSATIONS STARTED per month, not individual messages
// Once a conversation is started, users can send unlimited messages within it
// ALL PLANS NOW HAVE UNLIMITED MESSAGING
const PLAN_LIMITS: Record<string, PlanLimits> = {
  'free': { messages_per_month: 0, unlimited_messages: true }, // UNLIMITED - Free messaging for all
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
  
  // Token balance - actual tokens from database
  const tokenBalance = tokenData?.amount || 0;
  const tokenType = tokenData?.token_type || null;
  
  // Check if user has any free messaging matches
  const { data: freeMessagingMatches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ['free-messaging-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Check if user has any matches (for free messaging eligibility)
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`);
      
      if (error) {
        logger.error('[useMessagingQuota] Error fetching matches:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });
  
  // Get the current plan name
  const planName = subscription?.subscription_packages?.name || 'free';
  const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['free'];
  
  // Query to get CONVERSATIONS STARTED this month (not individual messages)
  const { data: conversationsStarted = 0 } = useQuery({
    queryKey: ['conversations-started-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Count conversations where the user sent the FIRST message this month
      // Conversations don't have client_id/owner_id - they link through matches
      // First get user's match IDs, then find conversations for those matches
      const { data: userMatches } = await supabase
        .from('matches')
        .select('id')
        .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`);
      
      const matchIds = userMatches?.map(m => m.id) || [];
      if (matchIds.length === 0) return 0;

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, created_at')
        .in('match_id', matchIds)
        .gte('created_at', startOfMonth.toISOString());
      
      if (error) {
        logger.error('[useMessagingQuota] Error fetching conversations count:', error);
        return 0;
      }
      
      if (!conversations || conversations.length === 0) return 0;

      // Batch query: Get first messages of all conversations in one query
      // using a subquery approach with DISTINCT ON
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

      // Group by conversation_id and get the first message for each
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
    enabled: !!user,
  });
  
  const isUnlimited = limits.unlimited_messages;
  const totalAllowed = limits.messages_per_month;
  const remainingConversations = isUnlimited ? 999999 : Math.max(0, totalAllowed - conversationsStarted);
  const canStartNewConversation = isUnlimited || remainingConversations > 0;
  
  const decrementConversationCount = () => {
    // Invalidate the query to refetch the count
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
    canSendMessage: true, // Always true - messages are unlimited within existing conversations
    isUnlimited,
    currentPlan: planName,
    hasFreeMessagingMatches: freeMessagingMatches.length > 0,
    freeMessagingMatchCount: freeMessagingMatches.length,
    decrementConversationCount,
    refreshQuota,
    // Token balance from tokens table
    tokenBalance,
    tokenType,
  };
}