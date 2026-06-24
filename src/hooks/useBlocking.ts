import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to block');

      const { error } = await supabase
        .from('user_blocks' as any)
        .insert({
          blocker_id: user.id,
          blocked_id: blockedId,
        });

      if (error) {
        if (error.code === '23505') {
            return { alreadyBlocked: true };
        }
        throw error;
      }

      // Guideline 1.2: blocking an abusive user must also notify the developer so
      // the offending account can be reviewed and acted on within 24 hours. We
      // file a lightweight moderation flag into the same review queue that the
      // in-app "Report" tool writes to. Best-effort and non-fatal — a failure
      // here must never break the block itself.
      try {
        const { error: flagError } = await supabase
          .from('user_reports' as any)
          .insert({
            reporter_id: user.id,
            reported_user_id: blockedId,
            report_type: 'harassment',
            report_category: 'user_profile',
            description: 'Auto-flagged from in-app Block action. The reporting user blocked this account; flagged for safety review.',
            status: 'pending',
          });
        if (flagError) logger.warn('[Block] moderation flag failed (non-fatal):', flagError);
      } catch (flagErr) {
        logger.warn('[Block] moderation flag threw (non-fatal):', flagErr);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['user_blocks'] });
      appToast.success('User blocked');
    },
    onError: (error: Error) => {
      logger.error('Error blocking user:', error);
      appToast.error('Failed to block user');
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to unblock');

      const { error } = await supabase
        .from('user_blocks' as any)
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['user_blocks'] });
      appToast.success('User unblocked');
    },
  });
}
