import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

/**
 * SIMPLE SWIPE LIKE HANDLER
 * 
 * Uses the unified `likes` table with direction column:
 * - Left swipe = direction: 'left' (dislike/dismiss)
 * - Right swipe = direction: 'right' (like/superlike)
 * 
 * Schema: likes(id, user_id, target_id, target_type, direction, created_at)
 * Unique constraint: (user_id, target_id, target_type)
 */
export function useSwipe() {
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async ({ targetId, targetType = 'listing', targetObject }) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: [targetType === 'listing' ? 'listings' : 'client-profiles'] });
      await queryClient.cancelQueries({ queryKey: [targetType === 'listing' ? 'liked-properties' : 'liked-clients'] });

      // Snapshot current data for rollback
      const prevData = queryClient.getQueryData([targetType === 'listing' ? 'listings' : 'client-profiles']);
      const prevLiked = queryClient.getQueryData([targetType === 'listing' ? 'liked-properties' : 'liked-clients']);

      // 🚀 SPEED OF LIGHT: Optimistic UI Update
      // Add the liked item to the cache IMMEDIATELY if it's a right swipe
      if (targetObject && targetObject.direction === 'right') {
        queryClient.setQueryData([targetType === 'listing' ? 'liked-properties' : 'liked-clients'], (old: any[] | undefined) => {
          if (!old) return [targetObject];
          // Avoid duplicates
          if (old.some(item => item.id === targetId)) return old;
          return [targetObject, ...old];
        });
      }

      return { prevData, prevLiked };
    },
    onError: (_err, vars, context) => {
      // Roll back
      if (context?.prevData) {
        queryClient.setQueryData([vars.targetType === 'listing' ? 'listings' : 'client-profiles'], context.prevData);
      }
      if (context?.prevLiked) {
        queryClient.setQueryData([vars.targetType === 'listing' ? 'liked-properties' : 'liked-clients'], context.prevLiked);
      }
      
      logger.error('[useSwipe] Error:', _err);
      toast.error('Could not save choice. Retrying in background...');
    },
    mutationFn: async ({ targetId, direction, targetType = 'listing' }: {
      targetId: string;
      direction: 'left' | 'right';
      targetType?: 'listing' | 'profile';
      targetObject?: any; // Full object for optimistic UI
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('likes')
        .upsert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
          direction: direction
        }, {
          onConflict: 'user_id,target_id,target_type'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return { success: true, direction, targetId, userId: user.id };
    },
    onSuccess: (data, variables) => {
      // Invalidate to ensure sync with server
      queryClient.invalidateQueries({ queryKey: [variables.targetType === 'listing' ? 'liked-properties' : 'liked-clients'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}
