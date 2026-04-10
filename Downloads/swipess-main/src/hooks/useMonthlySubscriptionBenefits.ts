import { useUserSubscription } from './useSubscription';
import { useMessageActivations } from './useMessageActivations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook for monthly subscription benefits
 * Provides visibility ranking, message limits, and feature access
 */
export function useMonthlySubscriptionBenefits() {
  const { data: subscription } = useUserSubscription();
  const { user } = useAuth();
  const messageActivations = useMessageActivations();

  // Extract subscription details (moved before query to use in messageLimit calculation)
  const pkg = subscription?.subscription_packages;
  const planName = pkg?.name || 'free';
  const tier = pkg?.tier || 'free';
  const isMonthly = subscription?.subscription_packages?.package_category?.includes('monthly');

  // Define message limits per tier (moved before query that uses it)
  // Note: These limits should match the subscription_packages table in the database
  const messageLimit = tier === 'unlimited' ? 30  // Unlimited tier: 30 messages/month
    : tier === 'premium_plus' ? 20  // Premium Plus tier: 20 messages/month
    : tier === 'premium' ? 12  // Premium tier: 12 messages/month
    : tier === 'basic' ? 6  // Basic tier: 6 messages/month
    : tier === 'pay_per_use' ? 0  // Pay-per-use: no monthly limit
    : 0;

  // Fetch monthly message usage
  const { data: monthlyUsage } = useQuery({
    queryKey: ['monthly-message-usage', user?.id, messageLimit],
    queryFn: async () => {
      if (!user?.id) return { used: 0, limit: 0 };

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      if (error) throw error;
      return {
        used: data?.length || 0,
        limit: messageLimit,
      };
    },
    enabled: !!user?.id && !!subscription?.is_active,
  });

  // Define visibility ranking (lower = more visible)
  const visibilityRank = tier === 'unlimited' ? 1
    : tier === 'premium_plus' ? 2
    : tier === 'premium' ? 3
    : tier === 'basic' ? 4
    : 999; // Free users at bottom

  // Define visibility percentage shown to others
  const visibilityPercentage = tier === 'unlimited' ? 100
    : tier === 'premium_plus' ? 80
    : tier === 'premium' ? 50
    : tier === 'basic' ? 25
    : 0;

  const benefits = {
    // Subscription info
    planName,
    tier,
    isMonthly,
    isActive: subscription?.is_active || false,
    paymentStatus: subscription?.payment_status || 'pending',

    // Message benefits
    messageLimit,
    messagesUsedThisMonth: monthlyUsage?.used || 0,
    messagesRemainingThisMonth: Math.max(0, (messageLimit || 0) - (monthlyUsage?.used || 0)),
    canSendMessage: (monthlyUsage?.used || 0) < (messageLimit || 0) && subscription?.is_active,

    // Visibility benefits
    visibilityRank,
    visibilityPercentage,
    isVisible: visibilityPercentage > 0,
    isPremium: tier !== 'free' && tier !== 'basic',
    isVIP: tier === 'unlimited',

    // Feature access
    canSeeLikes: tier !== 'free' && tier !== 'basic',
    hasAdvancedFilters: tier === 'premium' || tier === 'premium_plus' || tier === 'unlimited',
    hasUnlimitedActivations: tier === 'unlimited',
    hasPropertyBoost: tier === 'premium' || tier === 'premium_plus' || tier === 'unlimited',
    hasSuperLikes: tier === 'premium' || tier === 'premium_plus' || tier === 'unlimited',
    hasProfileBoost: tier === 'premium' || tier === 'premium_plus' || tier === 'unlimited',

    // Property limits (for owners)
    maxProperties: pkg?.max_listings || 0,

    // Activation benefits (pay-per-use fallback)
    canUsePayPerUse: messageActivations.canSendMessage,
    payPerUseRemaining: messageActivations.totalActivations,
  };

  return benefits;
}
