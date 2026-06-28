import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

type PlanLimits = {
  messages_per_month: number;
  unlimited_messages: boolean;
};

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { messages_per_month: 0, unlimited_messages: false },
  '1 Month Access': { messages_per_month: 0, unlimited_messages: true },
  '6 Months Access': { messages_per_month: 0, unlimited_messages: true },
  '1 Year Access': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM CLIENT': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM ++ CLIENT': { messages_per_month: 0, unlimited_messages: true },
  'UNLIMITED CLIENT': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM + OWNER': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM ++ OWNER': { messages_per_month: 0, unlimited_messages: true },
  'PREMIUM MAX OWNER': { messages_per_month: 0, unlimited_messages: true },
  'UNLIMITED OWNER': { messages_per_month: 0, unlimited_messages: true },
  'Ultimate Seeker': { messages_per_month: 0, unlimited_messages: true },
  'Multi-Matcher': { messages_per_month: 0, unlimited_messages: true },
  'Basic Explorer': { messages_per_month: 0, unlimited_messages: true },
  'Empire Builder': { messages_per_month: 0, unlimited_messages: true },
  'Multi-Asset Manager': { messages_per_month: 0, unlimited_messages: true },
  'Category Pro': { messages_per_month: 0, unlimited_messages: true },
  'Starter Lister': { messages_per_month: 0, unlimited_messages: true },
};

export const NO_TOKENS_ERROR =
  'You need message tokens or a premium plan to start a new conversation.';

/**
 * Promo: every user currently gets premium (unlimited) messaging for free.
 * This mirrors the server-side override in
 * supabase/migrations/20260623120000_free_premium_for_everyone.sql
 * (user_has_unlimited_messaging() always returns true). Flip this to false AND
 * restore that SQL function to re-enable paid messaging.
 */
export const PREMIUM_FOR_EVERYONE = true;

export async function fetchTokenBalance(userId: string): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === userId) {
      const { data: rpcRows, error: rpcError } = await supabase.rpc('rpc_get_user_tokens');
      if (!rpcError && rpcRows?.length) {
        return rpcRows[0].total_messages ?? 0;
      }
    }
  } catch {
    /* fall through to table read */
  }

  const { data, error } = await supabase
    .from('tokens')
    .select('remaining_activations, expires_at')
    .eq('user_id', userId);

  if (error) {
    if (error.code !== '42703') {
      logger.error('[messagingEntitlements] token fetch error:', error);
    }
    return 0;
  }

  const now = Date.now();
  return (data || []).reduce((sum, row) => {
    const expiresAt = (row as { expires_at?: string | null }).expires_at;
    if (expiresAt && new Date(expiresAt).getTime() <= now) return sum;
    return sum + (row.remaining_activations || 0);
  }, 0);
}

export async function fetchActivePlanName(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('subscription_packages(name), is_active, end_date')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return 'free';

  const pkg = (data as { subscription_packages?: { name?: string } | null }).subscription_packages;
  return pkg?.name || 'free';
}

export function computeCanStartNewConversation(input: {
  planName: string;
  tokenBalance: number;
  conversationsStartedThisMonth?: number;
}): boolean {
  if (PREMIUM_FOR_EVERYONE) return true;
  const limits = PLAN_LIMITS[input.planName] || PLAN_LIMITS.free;
  if (limits.unlimited_messages) return true;

  const hasSubscription = input.planName !== 'free';
  const started = input.conversationsStartedThisMonth ?? 0;
  const remaining = Math.max(0, limits.messages_per_month - started);

  return (hasSubscription && remaining > 0) || input.tokenBalance > 0;
}

export async function conversationExistsBetween(
  userId: string,
  otherUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(client_id.eq.${userId},owner_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},owner_id.eq.${userId})`,
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('[messagingEntitlements] conversation lookup error:', error);
    return false;
  }

  return !!data;
}

export async function assertCanStartNewConversation(
  userId: string,
  otherUserId: string,
): Promise<void> {
  // Promo: everyone can message for free. Skip the existence/token/plan network
  // round-trips entirely so opening a chat is instant instead of "stuck loading"
  // while three extra queries resolve.
  if (PREMIUM_FOR_EVERYONE) return;

  if (await conversationExistsBetween(userId, otherUserId)) return;

  const [tokenBalance, planName] = await Promise.all([
    fetchTokenBalance(userId),
    fetchActivePlanName(userId),
  ]);

  if (!computeCanStartNewConversation({ planName, tokenBalance })) {
    throw new Error(NO_TOKENS_ERROR);
  }
}