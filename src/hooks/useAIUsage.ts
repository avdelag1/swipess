/**
 * useAIUsage — Tracks and enforces AI usage limits per subscription tier.
 *
 * Reads from Supabase `ai_usage` table and merges with the user's
 * subscription tier to provide real-time limit checks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserSubscription } from './useSubscription';
import { getAITierLimits, type AITierLimits } from '@/config/aiTiers';

interface AIUsageRow {
  id: string;
  user_id: string;
  task_type: string;
  last_request_at: string;
  request_count: number;
}

interface AIUsageState {
  /** Messages sent today */
  messagesUsedToday: number;
  /** AI listings created this month */
  listingsUsedThisMonth: number;
  /** Whether the daily message cap has been reached */
  isAtMessageLimit: boolean;
  /** Whether the monthly listing cap has been reached */
  isAtListingLimit: boolean;
  /** Resolved tier limits */
  limits: AITierLimits;
  /** Tier name */
  tierName: string;
  /** Loading state */
  isLoading: boolean;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth()
  );
}

export function useAIUsage(): AIUsageState & {
  incrementMessages: () => Promise<void>;
  incrementListings: () => Promise<void>;
} {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription();
  const queryClient = useQueryClient();

  const tier = subscription?.subscription_packages?.tier || null;
  const limits = getAITierLimits(tier);
  const tierName = limits.label;

  // Fetch all ai_usage rows for this user
  const { data: usageRows, isLoading } = useQuery<AIUsageRow[]>({
    queryKey: ['ai-usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase
        .from('ai_usage' as any)
        .select('*')
        .eq('user_id', user.id) as any);
      if (error) {
        console.warn('[useAIUsage] Failed to fetch:', error);
        return [];
      }
      return (data || []) as AIUsageRow[];
    },
    enabled: !!user?.id,
    staleTime: 30_000, // 30s
  });

  // Derive daily message count
  const chatRow = usageRows?.find(r => r.task_type === 'chat');
  const messagesUsedToday =
    chatRow && isToday(chatRow.last_request_at) ? chatRow.request_count : 0;

  // Derive monthly listing count
  const listingRow = usageRows?.find(r => r.task_type === 'listing');
  const listingsUsedThisMonth =
    listingRow && isThisMonth(listingRow.last_request_at) ? listingRow.request_count : 0;

  const isAtMessageLimit = messagesUsedToday >= limits.dailyMessages;
  const isAtListingLimit = listingsUsedThisMonth >= limits.monthlyListings;

  // Upsert helper for incrementing usage
  const upsertUsage = async (taskType: string, isDaily: boolean) => {
    if (!user?.id) return;

    const existing = usageRows?.find(r => r.task_type === taskType);
    const now = new Date().toISOString();

    if (existing) {
      const shouldReset = isDaily
        ? !isToday(existing.last_request_at)
        : !isThisMonth(existing.last_request_at);

      await (supabase
        .from('ai_usage' as any)
        .update({
          request_count: shouldReset ? 1 : existing.request_count + 1,
          last_request_at: now,
        } as any)
        .eq('id', existing.id) as any);
    } else {
      await (supabase
        .from('ai_usage' as any)
        .insert({
          user_id: user.id,
          task_type: taskType,
          request_count: 1,
          last_request_at: now,
        } as any) as any);
    }

    // Refresh the cache
    queryClient.invalidateQueries({ queryKey: ['ai-usage', user.id] });
  };

  const incrementMessages = async () => upsertUsage('chat', true);
  const incrementListings = async () => upsertUsage('listing', false);

  return {
    messagesUsedToday,
    listingsUsedThisMonth,
    isAtMessageLimit,
    isAtListingLimit,
    limits,
    tierName,
    isLoading,
    incrementMessages,
    incrementListings,
  };
}
