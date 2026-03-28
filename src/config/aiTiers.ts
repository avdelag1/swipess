/**
 * AI Tier Configuration — Central source of truth for all AI usage limits.
 *
 * Maps subscription tiers → daily message caps, monthly listing limits,
 * max_tokens for the model, and feature flags.
 */

export interface AITierLimits {
  /** Human-friendly tier label */
  label: string;
  /** Max AI Concierge messages per day */
  dailyMessages: number;
  /** Max AI-generated listings per calendar month */
  monthlyListings: number;
  /** max_tokens passed to the LLM */
  maxTokens: number;
  /** Access to curated local expert knowledge RAG */
  expertKnowledge: boolean;
  /** AI-powered contextual tips & suggestions */
  smartSuggestions: boolean;
  /** Priority queue for AI responses (lower latency) */
  priorityResponse: boolean;
}

/**
 * Limits keyed by subscription_packages.tier (from DB).
 * Falls through to 'free' when no active subscription exists.
 */
export const AI_TIER_LIMITS: Record<string, AITierLimits> = {
  // No subscription or expired
  free: {
    label: 'Free',
    dailyMessages: 5,
    monthlyListings: 0,
    maxTokens: 400,
    expertKnowledge: false,
    smartSuggestions: false,
    priorityResponse: false,
  },

  // Monthly plan ($39 MXN) — "basic" tier in DB
  basic: {
    label: 'AI Lite',
    dailyMessages: 15,
    monthlyListings: 3,
    maxTokens: 500,
    expertKnowledge: false,
    smartSuggestions: false,
    priorityResponse: false,
  },

  // Semi-Annual plan ($119 MXN) — "premium" tier in DB
  premium: {
    label: 'AI Pro',
    dailyMessages: 50,
    monthlyListings: 10,
    maxTokens: 800,
    expertKnowledge: true,
    smartSuggestions: true,
    priorityResponse: false,
  },

  // Yearly plan ($299 MXN) — "unlimited" tier in DB
  unlimited: {
    label: 'AI Unlimited',
    dailyMessages: Infinity,
    monthlyListings: Infinity,
    maxTokens: 1500,
    expertKnowledge: true,
    smartSuggestions: true,
    priorityResponse: true,
  },
};

/**
 * Resolve the correct tier limits for a user.
 * @param tier - The tier string from subscription_packages.tier
 */
export function getAITierLimits(tier?: string | null): AITierLimits {
  if (!tier) return AI_TIER_LIMITS.free;
  const key = tier.toLowerCase();
  return AI_TIER_LIMITS[key] ?? AI_TIER_LIMITS.free;
}

/**
 * Returns a user-friendly description of remaining AI quota.
 */
export function formatQuota(used: number, limit: number): string {
  if (limit === Infinity) return 'Unlimited';
  const remaining = Math.max(0, limit - used);
  return `${remaining} left`;
}
