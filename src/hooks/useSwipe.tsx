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
    onMutate: async ({ targetId, targetType = 'listing' }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      await queryClient.cancelQueries({ queryKey: ['client-profiles'] });

      // Snapshot current data for rollback
      const prevListings = queryClient.getQueryData(['listings']);
      const prevProfiles = queryClient.getQueryData(['client-profiles']);

      // Optimistically remove the swiped card from the deck immediately
      if (targetType === 'listing') {
        queryClient.setQueriesData({ queryKey: ['listings'] }, (old: unknown) =>
          Array.isArray(old) ? old.filter((item: { id: string }) => item.id !== targetId) : old
        );
      } else {
        queryClient.setQueriesData({ queryKey: ['client-profiles'] }, (old: unknown) =>
          Array.isArray(old) ? old.filter((item: { id: string }) => item.id !== targetId) : old
        );
      }

      return { prevListings, prevProfiles };
    },
    onError: (_err, _vars, context) => {
      // Roll back optimistic update on error
      if (context?.prevListings !== undefined) {
        queryClient.setQueryData(['listings'], context.prevListings);
      }
      if (context?.prevProfiles !== undefined) {
        queryClient.setQueryData(['client-profiles'], context.prevProfiles);
      }
    },
    mutationFn: async ({ targetId, direction, targetType = 'listing' }: {
      targetId: string;
      direction: 'left' | 'right';
      targetType?: 'listing' | 'profile';
    }) => {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) {
        logger.error('[useSwipe] Auth error:', authError);
        throw new Error('Not authenticated');
      }

      logger.info('[useSwipe] Saving swipe:', { userId: user.id, targetId, direction, targetType });

      // Save swipe to likes table - use 'left'/'right' directly
      // This matches the query in useSmartMatching.tsx
      const { data, error } = await supabase
        .from('likes')
        .upsert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
          direction: direction  // 'left' or 'right' - matches queries
        }, {
          onConflict: 'user_id,target_id,target_type',
          ignoreDuplicates: false
        })
        .select()
        .maybeSingle();

      if (error) {
        logger.error('[useSwipe] Error saving swipe:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      logger.info('[useSwipe] Swipe saved successfully:', data);
      return { success: true, direction, targetId, userId: user.id };
    },
    onSuccess: (data, variables) => {
      logger.info('[useSwipe] Swipe success, invalidating queries:', data);
      
      // Invalidate ALL relevant query keys to ensure UI updates
      const keysToInvalidate = [
        ['liked-properties'],
        ['liked-properties', data.userId],
        ['liked-clients'],
        ['liked-clients', data.userId],
        ['matches'],
        ['smart-listings'],
        ['smart-clients'],
        ['owner-listing-likes'],
        ['owner-interested-clients'],
        ['listing-likers', variables.targetId],
      ];

      // Invalidate each key
      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key }).catch(err => logger.error('[useSwipe] Query invalidation failed:', err));
      });
      
      // CRITICAL: Also invalidate listings deck so swiped cards disappear immediately
      queryClient.invalidateQueries({ queryKey: ['listings'] }).catch(err => logger.error('[useSwipe] Listings invalidation failed:', err));
      
      // Also invalidate any queries that start with these prefixes
      queryClient.invalidateQueries({ queryKey: ['liked'] }).catch(err => logger.error('[useSwipe] Liked invalidation failed:', err));
      queryClient.invalidateQueries({ queryKey: ['match'] }).catch(err => logger.error('[useSwipe] Match invalidation failed:', err));
      queryClient.invalidateQueries({ queryKey: ['owner'] }).catch(err => logger.error('[useSwipe] Owner invalidation failed:', err));
    },
  });
}
