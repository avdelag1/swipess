import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

/**
 * useLikesRealtime - Real-time subscription for the 'likes' table
 * 
 * Automatically invalidates 'owner-interested-clients' and 'liked-properties'
 * when new likes are detected.
 */
export function useLikesRealtime(enabled = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !enabled) return;

    logger.info('[useLikesRealtime] Subscribing to likes table for user:', user.id);

    // Debounce listing-like invalidations so bursts of likes don't thrash the cache
    let listingDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const likesChannel = supabase
      .channel(`user-likes-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        async (payload) => {
          logger.info('[useLikesRealtime] Change detected in likes table:', payload.eventType);

          const record = payload.new as any || payload.old as any;
          if (!record) return;

          // Case 1: Someone liked the current user's profile
          if (record.target_type === 'profile' && record.target_id === user.id) {
            logger.info('[useLikesRealtime] New like on current user profile detected');
            queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
          }

          // Case 2: Someone liked a listing — debounce to avoid cache thrash on bulk likes
          if (record.target_type === 'listing') {
            if (listingDebounceTimer) clearTimeout(listingDebounceTimer);
            listingDebounceTimer = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
            }, 1500);
          }

          // Case 3: The user themselves liked something (from another device)
          if (record.user_id === user.id) {
            logger.info('[useLikesRealtime] User like from another device detected');
            queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
            queryClient.invalidateQueries({ queryKey: ['liked-clients'] });
          }
        }
      )
      .subscribe((status) => {
        logger.info('[useLikesRealtime] Subscription status:', status);
      });

    return () => {
      logger.info('[useLikesRealtime] Unsubscribing from likes table');
      if (listingDebounceTimer) clearTimeout(listingDebounceTimer);
      likesChannel.unsubscribe();
      supabase.removeChannel(likesChannel);
    };
  }, [user?.id, queryClient, enabled]);

  return null;
}


