
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasPremiumFeature, useUserSubscription } from '@/hooks/useSubscription';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { logger } from '@/utils/logger';

export function useMessaging() {
  return useQuery({
    queryKey: ['user-messaging-access'],
    queryFn: async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error) {
        logger.error('[useMessaging] Error fetching user for messaging access:', error);
        return { hasAccess: false, reason: 'error', error: error.message };
      }
      if (!user.user) return { hasAccess: false, reason: 'not_authenticated' };

      // Allow messaging for all authenticated users
      return { 
        hasAccess: true, 
        reason: 'authenticated_user',
        message: 'You have access to messaging!'
      };
    }
  });
}

export function useCanAccessMessaging() {
  const { data: subscription } = useUserSubscription();
  const { canSendMessage } = useMessagingQuota();
  
  // User needs an active subscription or has remaining free messages
  const needsUpgrade = !canSendMessage;
  
  return {
    canAccess: canSendMessage,
    needsUpgrade
  };
}
