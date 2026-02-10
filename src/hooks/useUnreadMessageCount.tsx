import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { logger } from '@/utils/prodLogger';
import { playNotificationSound } from '@/utils/notificationSounds';

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: ['unread-message-count', user?.id],
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent badge flickering
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user?.id) return 0;

      try {
        // Get all conversations for this user
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
          .eq('status', 'active');

        if (convError) throw convError;
        if (!conversations?.length) return 0;

        // Get conversation IDs as array
        const conversationIds = conversations.map(c => c.id);

        // OPTIMIZED: Use COUNT query instead of fetching all messages
        // Count unique conversations with unread messages using a single efficient query
        const { count, error: unreadError } = await supabase
          .from('conversation_messages')
          .select('conversation_id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        if (unreadError) throw unreadError;

        // Return count of unread conversations (capped to avoid performance issues)
        return Math.min(count || 0, 99);
      } catch (error) {
        logger.error('[UnreadCount] Error:', error);
        return 0;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds to prevent excessive refetching
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
  });

  // Debounced refetch function to prevent excessive updates
  const debouncedRefetch = () => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      query.refetch();
    }, 1000); // Wait 1 second before refetching
  };

  // Set up real-time subscription for unread messages
  // Only listen to new message events (not updates) to reduce refetch frequency
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages'
        },
        (payload) => {
          // Only refetch if the message is not from the current user
          if (payload.new.sender_id !== user.id) {
            debouncedRefetch();

            // Play notification sound for incoming message
            playNotificationSound('message').catch((error) => {
              logger.warn('[UnreadCount] Failed to play notification sound:', error);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_messages'
        },
        (payload) => {
          // Only refetch if is_read status changed
          if (payload.old.is_read !== payload.new.is_read) {
            debouncedRefetch();
          }
        }
      )
      .subscribe();

    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      // Properly unsubscribe before removing channel
      channel.unsubscribe();
    };
    // Note: debouncedRefetch is intentionally excluded as it references query.refetch which is stable
  }, [user?.id]);

  return {
    unreadCount: query.data || 0,
    isLoading: query.isLoading,
    refetch: query.refetch
  };
}