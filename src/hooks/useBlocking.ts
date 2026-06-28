import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';

export interface BlockedUser {
  blocked_id: string;
  created_at: string;
  full_name: string;
  avatar_url?: string;
}

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
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      appToast.success('User unblocked');
    },
  });
}

/**
 * Fetches the users the current user has blocked, with display name + avatar,
 * for the "Blocked Users" management screen in Settings.
 */
export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: async (): Promise<BlockedUser[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: blocks, error } = await supabase
        .from('user_blocks' as any)
        .select('blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !blocks || blocks.length === 0) return [];

      const ids = (blocks as any[]).map((b) => b.blocked_id);

      const [clientsRes, ownersRes] = await Promise.all([
        supabase.from('client_profiles').select('user_id, name, full_name, profile_images').in('user_id', ids),
        supabase.from('owner_profiles').select('user_id, business_name, profile_images').in('user_id', ids),
      ]);

      const profileMap = new Map<string, { full_name: string; avatar_url?: string }>();
      for (const c of (clientsRes.data ?? []) as any[]) {
        profileMap.set(c.user_id, { full_name: c.name || c.full_name || 'User', avatar_url: c.profile_images?.[0] });
      }
      for (const o of (ownersRes.data ?? []) as any[]) {
        if (!profileMap.has(o.user_id)) {
          profileMap.set(o.user_id, { full_name: o.business_name || 'User', avatar_url: o.profile_images?.[0] });
        }
      }

      return (blocks as any[]).map((b) => ({
        blocked_id: b.blocked_id,
        created_at: b.created_at,
        full_name: profileMap.get(b.blocked_id)?.full_name ?? 'User',
        avatar_url: profileMap.get(b.blocked_id)?.avatar_url,
      }));
    },
  });
}
