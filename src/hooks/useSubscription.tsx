
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

// Lightweight types to avoid deep Supabase type inference and match DB shapes
type SubscriptionPackageLite = {
  id: number;
  name: string;
  tier?: string;
  features?: unknown;
  package_category?: string;
  message_activations?: number;
  legal_documents_included?: number;
  best_deal_notifications?: number;
  max_listings?: number;
  duration_days?: number;
  early_profile_access?: boolean;
  advanced_match_tips?: boolean;
  seeker_insights?: boolean;
  availability_sync?: boolean;
  market_reports?: boolean;
} | null;

type UserSubscriptionLite = {
  id: number;
  user_id: string;
  is_active?: boolean;
  payment_status?: string;
  // include only the fields we actually read
  subscription_packages?: SubscriptionPackageLite;
} | null;

export function useSubscriptionPackages(userTier?: string) {
  return useQuery({
    queryKey: ['subscription-packages', userTier],
    queryFn: async () => {
      // Break heavy inference by casting table identifier to any
      let query: any = supabase.from('subscription_packages' as any).select('*');
      
      if (userTier) {
        query = query.eq('tier', userTier);
      }

      const { data, error } = await query.order('price', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserSubscription() {
  return useQuery<UserSubscriptionLite>({
    queryKey: ['user-subscription'],
    queryFn: async (): Promise<UserSubscriptionLite> => {
      const { data: user, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.error('Error fetching authenticated user:', authError);
        throw authError;
      }
      if (!user.user) return null;

      // Limit columns and break inference to avoid TS2589
      const { data, error }: any = await (supabase
        .from('user_subscriptions' as any)
        .select('id,user_id,is_active,payment_status,subscription_packages(id,name,tier,features,package_category,message_activations,legal_documents_included,early_profile_access,advanced_match_tips,seeker_insights,availability_sync,market_reports,max_listings)')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .maybeSingle());

      // Ignore "no rows" error code; treat as null result
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      // Map to our lightweight type
      const mapped: NonNullable<UserSubscriptionLite> = {
        id: data.id as number,
        user_id: data.user_id as string,
        is_active: data.is_active as boolean | undefined,
        payment_status: data.payment_status as string | undefined,
        subscription_packages: data.subscription_packages
          ? {
              id: data.subscription_packages.id as number,
              name: data.subscription_packages.name as string,
              tier: data.subscription_packages.tier as string | undefined,
              features: data.subscription_packages.features as unknown,
              package_category: data.subscription_packages.package_category as string | undefined,
              message_activations: data.subscription_packages.message_activations as number | undefined,
              legal_documents_included: data.subscription_packages.legal_documents_included as number | undefined,
              early_profile_access: data.subscription_packages.early_profile_access as boolean | undefined,
              advanced_match_tips: data.subscription_packages.advanced_match_tips as boolean | undefined,
              seeker_insights: data.subscription_packages.seeker_insights as boolean | undefined,
              availability_sync: data.subscription_packages.availability_sync as boolean | undefined,
              market_reports: data.subscription_packages.market_reports as boolean | undefined,
              max_listings: data.subscription_packages.max_listings as number | undefined,
            }
          : null,
      };

      return mapped;
    },
  });
}

export function useHasPremiumFeature(feature: string) {
  const { data: subscription } = useUserSubscription();
  if (!subscription) return false;

  const featuresRaw = subscription.subscription_packages?.features;
  const features: string[] = Array.isArray(featuresRaw) ? (featuresRaw as string[]) : [];

  return features.includes(feature) || features.includes('all_features');
}
