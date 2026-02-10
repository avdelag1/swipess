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
    mutationFn: async ({ targetId, direction, targetType = 'listing' }: {
      targetId: string;
      direction: 'left' | 'right';
      targetType?: 'listing' | 'profile';
    }) => {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) {
        throw new Error('Not authenticated');
      }

      // Save swipe to likes table - use 'left'/'right' directly
      // This matches the query in useSmartMatching.tsx
      const { error } = await supabase
        .from('likes')
        .upsert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
          direction: direction  // 'left' or 'right' - matches queries
        }, {
          onConflict: 'user_id,target_id,target_type',
          ignoreDuplicates: false
        });

      if (error) {
        logger.error('[useSwipe] Error saving swipe:', error);
        throw error;
      }

      return { success: true, direction, targetId };
    },
    onSuccess: (data) => {
      // Invalidate likes cache so saved list updates
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['liked-clients'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['matches'] }).catch(() => {});
    },
    onError: (error: any) => {
      logger.error('[useSwipe] Error:', error);
      toast({
        title: 'Error Saving',
        description: error?.message || 'Could not save. Please try again.',
        variant: 'destructive'
      });
    }
  });
}
