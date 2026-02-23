// @ts-nocheck
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // SPEED OF LIGHT: Do NOT request notification permission on startup
    // Permission should only be requested from user action (settings button)
    // Silently subscribe to messages without prompting

    // Subscribe to messages for this user
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Only show notifications for messages not sent by current user
          if (newMessage.sender_id !== user.id) {
            // Get conversation details to check if current user is involved
            const { data: conversation, error: convError } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', newMessage.conversation_id)
              .maybeSingle();

            if (convError) {
              if (import.meta.env.DEV) logger.error('Error fetching conversation for notification:', convError);
              return;
            }
            if (!conversation) return;

            if (conversation.client_id === user.id || conversation.owner_id === user.id) {

              // Get sender info
              const { data: senderProfile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', newMessage.sender_id)
                .maybeSingle();

              if (profileError) {
                if (import.meta.env.DEV) logger.error('Error fetching sender profile for notification:', profileError);
              }

              const senderName = senderProfile?.full_name || 'Someone';
              
              // Show toast notification
              toast({
                title: "New Message",
                description: `${senderName}: ${newMessage.message_text.slice(0, 50)}${newMessage.message_text.length > 50 ? '...' : ''}`,
                duration: 4000,
              });

              // Show browser notification when app is not in the foreground
              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted' &&
                document.visibilityState !== 'visible'
              ) {
                new Notification(`Message from ${senderName}`, {
                  body: newMessage.message_text.slice(0, 100),
                  icon: senderProfile?.avatar_url || '/placeholder.svg',
                  tag: `message-${newMessage.id}`,
                  requireInteraction: false,
                });
              }

              // Fire push notification to reach other devices / closed browser tabs
              supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: user.id,
                  title: `Message from ${senderName}`,
                  body: newMessage.message_text.slice(0, 100),
                  url: '/messages',
                  data: {
                    type: 'message',
                    conversation_id: newMessage.conversation_id,
                    sender_id: newMessage.sender_id,
                  },
                },
              }).catch((err) => {
                if (import.meta.env.DEV) logger.error('[useNotifications] Push failed:', err);
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      // Properly unsubscribe before removing channel
      channel.unsubscribe();
    };
  }, [user?.id]);

  return {
    requestPermission: () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.requestPermission();
      }
      return Promise.resolve('denied');
    },
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  };
}