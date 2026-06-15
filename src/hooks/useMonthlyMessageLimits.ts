import { useMessagingQuota } from './useMessagingQuota';

export function useMonthlyMessageLimits() {
  const {
    conversationsStartedThisMonth,
    remainingConversations,
    totalAllowed,
    canStartNewConversation,
    isUnlimited,
    currentPlan,
    tokenBalance,
  } = useMessagingQuota();

  const messageLimit = isUnlimited ? 999999 : Math.max(totalAllowed, tokenBalance);
  const messagesRemaining = isUnlimited ? 999999 : Math.max(remainingConversations, tokenBalance);

  return {
    messagesUsed: conversationsStartedThisMonth,
    messagesRemaining,
    messageLimit,
    canSendMessage: canStartNewConversation,
    isAtLimit: !canStartNewConversation,
    limitPercentage: messageLimit > 0
      ? Math.min(100, (conversationsStartedThisMonth / messageLimit) * 100)
      : 0,
    hasMonthlyLimit: !isUnlimited && currentPlan === 'free' && tokenBalance === 0,
    isLoading: false,
    isActive: true,
    tier: currentPlan,
  };
}