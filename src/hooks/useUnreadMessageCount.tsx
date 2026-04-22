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
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user?.id) return 0;

      try {
        // Query conversations directly — user is either client_id or owner_id
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`);

        if (convError) throw convError;
        if (!conversations?.length) return 0;

        const conversationIds = conversations.map(c => c.id);

        // Count distinct conversations with unread messages (not individual messages)
        const { data: unreadRows, error: unreadError } = await supabase
          .from('conversation_messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        if (unreadError) throw unreadError;

        const uniqueConversations = new Set(unreadRows?.map(m => m.conversation_id));
        return Math.min(uniqueConversations.size, 99);
      } catch (error) {
        logger.error('[UnreadCount] Error:', error);
        return 0;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  const debouncedRefetch = () => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      query.refetch();
    }, 1000);
  };

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
          if (payload.new.sender_id !== user.id) {
            debouncedRefetch();
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
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    unreadCount: query.data || 0,
    isLoading: query.isLoading,
    refetch: query.refetch
  };
}


