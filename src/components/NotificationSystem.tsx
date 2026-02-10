import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/prodLogger';

export function NotificationSystem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Request notification permission if not already granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            toast.success("🔔 Notifications Enabled", {
              description: "You'll now receive real-time message notifications!"
            });
          }
        })
        .catch(() => {
          // Notification permission request failed - non-critical
        });
    }

    // Subscribe to new messages for real-time notifications
    const messagesChannel = supabase
      .channel('user-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
        },
        async (payload) => {
          try {
            const newMessage = payload.new;

            // Only show notifications for messages not sent by current user
            if (newMessage.sender_id !== user.id) {
              // Check if current user is part of this conversation
              const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .select('client_id, owner_id')
                .eq('id', newMessage.conversation_id)
                .maybeSingle();

              if (convError || !conversation) {
                // Conversation not found or error - skip notification
                return;
              }

              if (conversation.client_id === user.id || conversation.owner_id === user.id) {

                // Get sender info
                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('id', newMessage.sender_id)
                  .maybeSingle();

                const senderName = senderProfile?.full_name || 'Someone';

                // Show toast notification
                const messageText = newMessage.message_text || '';
                toast.info(`💬 New Message`, {
                  description: `${senderName}: ${messageText.slice(0, 60)}${messageText.length > 60 ? '...' : ''}`
                });

                // Save to notifications table (non-blocking, errors are non-critical)
                supabase.from('notifications').insert([{
                  user_id: user.id,
                  notification_type: 'new_message',
                  title: `New message from ${senderName}`,
                  message: `${senderName}: ${messageText.slice(0, 100)}${messageText.length > 100 ? '...' : ''}`,
                  is_read: false
                }]).then(
                  () => { /* Notification saved successfully */ },
                  () => { /* Notification save failed - non-critical, user still sees toast */ }
                );

                // Show browser notification if permission granted
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  const notificationText = newMessage.message_text || 'New message';
                  const notification = new Notification(`New message from ${senderName}`, {
                    body: notificationText.slice(0, 100),
                    icon: senderProfile?.avatar_url || '/placeholder.svg',
                    tag: `message-${newMessage.id}`,
                    badge: '/favicon.ico',
                    requireInteraction: false,
                  });

                  // Auto-close notification after 3 seconds
                  setTimeout(() => notification.close(), 3000);

                  // Handle notification click
                  notification.onclick = () => {
                    window.focus();
                    notification.close();
                    // Navigate to messages if not already there
                    if (!window.location.pathname.includes('/messages')) {
                      window.location.href = '/messages';
                    }
                  };
                }

                // Invalidate relevant queries to update UI
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
                queryClient.invalidateQueries({
                  queryKey: ['conversation-messages', newMessage.conversation_id]
                });
              }
            }
          } catch (error) {
            // Notification handling error - non-critical, don't break the app
            if (import.meta.env.DEV) {
              logger.error('[NotificationSystem] Error handling message notification:', error);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to likes for notifications
    const likesChannel = supabase
      .channel('user-like-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
        },
        async (payload) => {
          try {
            const newLike = payload.new;

            // Only show notifications for likes received (not given)
            // SCHEMA: target_id = listing ID when target_type = 'listing'
            if (newLike.target_type === 'listing' && newLike.target_id && newLike.user_id !== user.id) {
              // Check if this listing belongs to the current user
              const { data: listing } = await supabase
                .from('listings')
                .select('owner_id, title')
                .eq('id', newLike.target_id)
                .maybeSingle();

              // Only notify if the current user owns the listing
              if (listing?.owner_id !== user.id) {
                return;
              }

              // Get liker info
              const { data: likerProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', newLike.user_id)
                .maybeSingle();

              const likerName = likerProfile?.full_name || 'Someone';

              // Show toast notification
              toast.success(`🔥 New Flame`, {
                description: `${likerName} liked your property!`
              });

              // Save to notifications table (non-blocking, errors are non-critical)
              supabase.from('notifications').insert([{
                user_id: user.id,
                notification_type: 'new_like',
                title: '🔥 New Flame',
                message: `${likerName} liked your property!`,
                is_read: false
              }]).then(
                () => { /* Notification saved successfully */ },
                () => { /* Notification save failed - non-critical, user still sees toast */ }
              );

              // Show browser notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(`New like from ${likerName}`, {
                  body: `${likerName} liked your ${newLike.direction === 'client_to_listing' ? 'property' : 'profile'}!`,
                  icon: likerProfile?.avatar_url || '/placeholder.svg',
                  tag: `like-${newLike.id}`,
                  badge: '/favicon.ico',
                });

                setTimeout(() => notification.close(), 3000);
              }
            }
          } catch (error) {
            // Like notification handling error - non-critical
            if (import.meta.env.DEV) {
              logger.error('[NotificationSystem] Error handling like notification:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      // FIX: Use .unsubscribe() instead of .removeChannel() for proper cleanup
      // .unsubscribe() properly stops event listening and prevents memory leaks
      messagesChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return null; // This component doesn't render anything
}