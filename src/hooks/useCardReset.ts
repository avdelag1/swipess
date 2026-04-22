import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';

export function useCardReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetType: 'listing' | 'profile' | 'all' = 'all') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      logger.info(`[useCardReset] Resetting swipes for ${targetType}`);

      // 1. Clear 'left' swipes from likes table
      let likesQuery = supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('direction', 'left');

      if (targetType !== 'all') {
        likesQuery = likesQuery.eq('target_type', targetType);
      }

      const { error: likesError } = await likesQuery;
      if (likesError) throw likesError;

      // 2. Clear 'pass' actions from profile_views table
      let viewsQuery = supabase
        .from('profile_views')
        .delete()
        .eq('user_id', user.id)
        .eq('action', 'pass');

      if (targetType === 'listing') {
        viewsQuery = viewsQuery.eq('view_type', 'listing');
      } else if (targetType === 'profile') {
        viewsQuery = viewsQuery.eq('view_type', 'profile');
      }

      const { error: viewsError } = await viewsQuery;
      if (viewsError) throw viewsError;

      return { success: true };
    },
    onSuccess: () => {
      triggerHaptic('heavy');
      
      // Invalidate all related queries to force a fresh deck
      queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
      queryClient.invalidateQueries({ queryKey: ['smart-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-swipes'] });
      queryClient.invalidateQueries({ queryKey: ['profile-views'] });
      queryClient.invalidateQueries({ queryKey: ['recycled-profiles'] });
      
      appToast.success('Deck Reset', 'Your card deck has been refreshed. Previously passed items will reappear!');
    },
    onError: (error) => {
      logger.error('[useCardReset] Reset error:', error);
      appToast.error('Reset Failed', 'Could not reset your swipes. Please try again.');
    }
  });
}
