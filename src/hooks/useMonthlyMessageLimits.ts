import { useAuth } from './useAuth';

/**
 * Hook to enforce monthly message limits
 * Currently disabled - all messaging is free for testing
 */
export function useMonthlyMessageLimits() {
  const { user } = useAuth();

  return {
    // Usage info
    messagesUsed: 0,
    messagesRemaining: 999,
    messageLimit: 999,

    // Permissions - always allow for testing
    canSendMessage: true,
    isAtLimit: false,
    limitPercentage: 0,

    // Status - no monthly limit enforced
    hasMonthlyLimit: false,
    isLoading: false,
    isActive: true,
    tier: 'free',
  };
}
