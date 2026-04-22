import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

export function useMatchRealtime(enabled = true) {
  const { user } = useAuth();
  const [matchCelebration, setMatchCelebration] = useState<{
    isOpen: boolean;
    matchedUser?: any;
  }>({ isOpen: false });

  const handleMatch = useCallback(async (match: any) => {
    try {
      if (!user?.id) return;

      const isClient = match.client_id === user.id;
      const otherUserId = isClient ? match.owner_id : match.client_id;
      const otherUserRole = isClient ? 'owner' : 'client';

      // Fetch the other user's profile info for the celebration
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (error) {
        logger.error('[useMatchRealtime] Error fetching matched profile:', error);
        return;
      }

      setMatchCelebration({
        isOpen: true,
        matchedUser: {
          name: profile?.full_name || 'Someone',
          avatar: profile?.avatar_url,
          role: otherUserRole
        }
      });

    } catch (err) {
      logger.error('[useMatchRealtime] Unexpected error handling match:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !enabled) return;

    // Subscribe to new matches where current user is a participant
    const matchesChannel = supabase
      .channel('global-matches-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `client_id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('[useMatchRealtime] New match detected (client):', payload.new);
          handleMatch(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('[useMatchRealtime] New match detected (owner):', payload.new);
          handleMatch(payload.new);
        }
      )
      .subscribe();

    return () => {
      matchesChannel.unsubscribe();
      supabase.removeChannel(matchesChannel);
    };
  }, [user?.id, handleMatch, enabled]);

  return {
    matchCelebration,
    closeCelebration: () => setMatchCelebration(prev => ({ ...prev, isOpen: false })),
  };
}


