import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { useAuth } from '@/hooks/useAuth';

/**
 * OPTIMISTIC SWIPE HANDLER — Instagram-speed mutations
 * 
 * Enhancements:
 * - Optimistic removal from deck cache on BOTH directions (not just right)
 * - Silent retry (2 attempts) before showing error
 * - Removes swiped item from listings/profiles cache to prevent flicker-back
 */
export function useSwipe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    retry: 2, // Silent retry on failure
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    onMutate: async ({ targetId, direction, targetType = 'listing', targetObject }) => {
      const listingsKey = targetType === 'listing' ? 'listings' : 'client-profiles';
      const likedKeyBase = targetType === 'listing' ? 'liked-properties' : 'liked-clients';
      const likedKey = [likedKeyBase, user?.id];

      // Cancel in-flight refetches
      await queryClient.cancelQueries({ queryKey: [listingsKey] });
      await queryClient.cancelQueries({ queryKey: likedKey });

      // Snapshot for rollback
      const prevData = queryClient.getQueryData([listingsKey]);
      const prevLiked = queryClient.getQueryData(likedKey);

      // 🚀 Optimistic: Remove swiped item from deck cache (BOTH directions)
      // This prevents the card from flickering back into view
      queryClient.setQueryData([listingsKey], (old: any[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter(item => (item.id || item.user_id) !== targetId);
      });

      // Also filter from smart-listings queries
      queryClient.setQueriesData({ queryKey: ['smart-listings'] }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((item: any) => (item.id || item.user_id) !== targetId);
      });

      // Add to liked cache if right swipe
      if (direction === 'right' && targetObject) {
        queryClient.setQueryData(likedKey, (old: any[] | undefined) => {
          if (!old) return [targetObject];
          if (old.some(item => item.id === targetId)) return old;
          return [targetObject, ...old];
        });
      }

      return { prevData, prevLiked, listingsKey, likedKey };
    },
    onError: (_err, vars, context) => {
      // Roll back all optimistic updates
      if (context?.prevData) {
        queryClient.setQueryData([context.listingsKey], context.prevData);
      }
      if (context?.prevLiked) {
        queryClient.setQueryData(context.likedKey, context.prevLiked);
      }
      
      logger.error('[useSwipe] Error after retries:', _err);
      appToast.error('Could not save choice. Please try again.');
    },
    mutationFn: async ({ targetId, direction, targetType = 'listing' }: {
      targetId: string;
      direction: 'left' | 'right';
      targetType?: 'listing' | 'profile';
      targetObject?: any;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user;
      if (!sessionUser?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .upsert({
          user_id: sessionUser.id,
          target_id: targetId,
          target_type: targetType,
          direction: direction
        }, {
          onConflict: 'user_id,target_id,target_type'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return { success: true, direction, targetId, userId: sessionUser.id };
    },
    onSuccess: (_data, variables) => {
      // Background invalidation to sync with server — use full key with user ID
      const likedKeyBase = variables.targetType === 'listing' ? 'liked-properties' : 'liked-clients';
      queryClient.invalidateQueries({ queryKey: [likedKeyBase, user?.id] });
      // Also invalidate without user ID for any legacy consumers
      queryClient.invalidateQueries({ queryKey: [likedKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}


