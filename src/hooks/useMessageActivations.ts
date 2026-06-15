import { useMessagingQuota } from './useMessagingQuota';

/** @deprecated Prefer useMessagingQuota — kept for MessagingDashboard compatibility */
export function useMessageActivations() {
  const quota = useMessagingQuota();

  return {
    totalActivations: quota.tokenBalance,
    canSendMessage: quota.canStartNewConversation,
    useActivation: {
      mutate: () => {},
      mutateAsync: async () => ({ success: true }),
      isPending: false,
    },
    isLoading: false,
    payPerUseCount: 0,
    monthlyCount: 0,
    referralBonusCount: 0,
  };
}