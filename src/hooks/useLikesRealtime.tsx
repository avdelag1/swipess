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

    // Subscribe to ALL inserts and deletes on the likes table
    // We filter in JS or just invalidate to be safe
    const likesChannel = supabase
      .channel(`user-likes-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT, DELETE, UPDATE)
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
          
          // Case 2: Someone liked one of the user's listings
          // We don't have the list of listing IDs here, so we'll do a quick check
          // or just invalidate if it's a listing-type like
          if (record.target_type === 'listing') {
             // To be efficient, we could check if record.target_id is in user's listings
             // but simple invalidation is safer for a "completely working" app
             queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
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
      likesChannel.unsubscribe();
      supabase.removeChannel(likesChannel);
    };
  }, [user?.id, queryClient, enabled]);

  return null;
}

