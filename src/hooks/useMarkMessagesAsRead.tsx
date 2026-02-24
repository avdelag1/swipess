import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

export function useMarkMessagesAsRead(conversationId: string, isActive: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId || !user?.id || !isActive) return;

    // Mark all unread messages in this conversation as read
    const markAsRead = async () => {
      const { error } = await supabase
        .from('conversation_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error && import.meta.env.DEV) {
        logger.error('[MarkAsRead] Error:', error);
      }
    };

    // Mark as read immediately
    markAsRead();

    // Mark as read when new messages arrive (if conversation is active)
    const channel = supabase
      .channel(`mark-read-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // If message is from someone else, mark it as read immediately
          if (payload.new.sender_id !== user.id) {
            supabase
              .from('conversation_messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                if (error && import.meta.env.DEV) {
                  logger.error('[MarkAsRead] Error marking new message as read:', error);
                }
              }, () => {
                // Non-critical error - message may still be marked as read
              });
          }
        }
      )
      .subscribe();

    return () => {
      // FIX: Use .unsubscribe() instead of .removeChannel() for proper cleanup
      // .unsubscribe() properly stops event listening and prevents memory leaks
      channel.unsubscribe();
    };
  }, [conversationId, user?.id, isActive]);
}
