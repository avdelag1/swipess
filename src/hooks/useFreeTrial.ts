import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isGodModeUser } from '@/utils/godModeUsers';

/** Number of days the free trial lasts from account creation */
const FREE_TRIAL_DAYS = 30;

interface FreeTrialInfo {
  /** Whether the user is currently within their free trial period */
  isTrialActive: boolean;
  /** When the trial expires (null if no trial data) */
  trialEndsAt: Date | null;
  /** Number of days remaining in the trial (0 if expired) */
  daysRemaining: number;
  /** Whether this user is a God Mode user (unlimited forever) */
  isGodMode: boolean;
}

/**
 * Hook to check if the current user is within their 30-day free trial.
 *
 * During the trial, users get full access to AI Chat, VIP Card, Legal Services, etc.
 * After 30 days, they must subscribe to a premium plan for continued access.
 *
 * God Mode users always return isTrialActive = true.
 */
export function useFreeTrial(): FreeTrialInfo & { isLoading: boolean } {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading } = useQuery<FreeTrialInfo>({
    queryKey: ['free-trial', userId],
    queryFn: async (): Promise<FreeTrialInfo> => {
      if (!userId) {
        return { isTrialActive: false, trialEndsAt: null, daysRemaining: 0, isGodMode: false };
      }

      // God Mode users always have unlimited access
      if (isGodModeUser(userId)) {
        return { isTrialActive: true, trialEndsAt: null, daysRemaining: 9999, isGodMode: true };
      }

      // Get user's account creation date from auth metadata or profiles table
      const createdAt = user?.created_at;

      if (!createdAt) {
        // Fallback: query the profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .maybeSingle();

        if (!profile?.created_at) {
          return { isTrialActive: false, trialEndsAt: null, daysRemaining: 0, isGodMode: false };
        }

        const trialEnd = new Date(profile.created_at);
        trialEnd.setDate(trialEnd.getDate() + FREE_TRIAL_DAYS);

        const now = new Date();
        const msRemaining = trialEnd.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

        return {
          isTrialActive: msRemaining > 0,
          trialEndsAt: trialEnd,
          daysRemaining,
          isGodMode: false,
        };
      }

      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + FREE_TRIAL_DAYS);

      const now = new Date();
      const msRemaining = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      return {
        isTrialActive: msRemaining > 0,
        trialEndsAt: trialEnd,
        daysRemaining,
        isGodMode: false,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    isTrialActive: data?.isTrialActive ?? false,
    trialEndsAt: data?.trialEndsAt ?? null,
    daysRemaining: data?.daysRemaining ?? 0,
    isGodMode: data?.isGodMode ?? false,
    isLoading,
  };
}
