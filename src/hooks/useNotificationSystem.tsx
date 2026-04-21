import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';
import { useProfileCache } from '@/hooks/useProfileCache';
import { useNotificationStore, NotificationType, Notification } from '@/state/notificationStore';

// DBNotification matches actual Supabase schema
interface DBNotification {
  id: string;
  user_id: string;
  notification_type: string;  
  message: string | null;
  is_read: boolean;           
  created_at: string;
  title: string | null;
  link_url: string | null;
  related_user_id: string | null;
  metadata: any;
}

export function useNotificationSystem() {
  const { 
    notifications, 
    addNotification, 
    dismissNotification, 
    markAllAsRead, 
    clearAll: _clearAll 
  } = useNotificationStore();
  
  const { user } = useAuth();
  const { getProfile: _getProfile } = useProfileCache();

  // Map database notification types to frontend types
  const notificationTypeMap: Record<string, NotificationType> = {
    'new_like': 'like',
    'new_match': 'match',
    'new_message': 'message',
    'new_review': 'like',
    'property_inquiry': 'message',
    'contract_signed': 'like',
    'contract_pending': 'like',
    'payment_received': 'premium_purchase',
    'profile_viewed': 'like',
    'system_announcement': 'like',
    'verification_approved': 'like',
    'subscription_expiring': 'premium_purchase',
  };

  const titleMap: Record<string, string> = {
    'new_like': 'New Like',
    'new_match': 'It\'s a Match!',
    'new_message': 'New Message',
    'new_review': 'New Review',
    'property_inquiry': 'Property Inquiry',
    'contract_signed': 'Contract Signed',
    'payment_received': 'Payment Received',
    'profile_viewed': 'Profile Viewed',
    'system_announcement': 'Announcement',
  };

  // Fetch existing notifications on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        (data as unknown as DBNotification[]).forEach((notif) => {
          const type = notificationTypeMap[notif.notification_type] || 'like';
          addNotification({
            id: notif.id,
            type,
            title: notif.title || titleMap[notif.notification_type] || 'Notification',
            message: notif.message || '',
            timestamp: new Date(notif.created_at),
            read: notif.is_read || false,
            actionUrl: notif.link_url,
            relatedUserId: notif.related_user_id,
            metadata: notif.metadata || {},
          } as any);
        });
      }
    };

    fetchNotifications();
  }, [user?.id, addNotification]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const notificationsChannel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const dbNotification = payload.new as any;
          if (!dbNotification) return;

          const notification: Partial<Notification> = {
            id: dbNotification.id,
            type: notificationTypeMap[dbNotification.notification_type] || 'like',
            title: dbNotification.title || titleMap[dbNotification.notification_type] || 'Notification',
            message: dbNotification.message || '',
            timestamp: new Date(dbNotification.created_at),
            read: dbNotification.is_read || false,
            actionUrl: dbNotification.link_url,
            relatedUserId: dbNotification.related_user_id,
            metadata: dbNotification.metadata || {},
          };

          // Add avatar from metadata if available
          if (dbNotification.metadata?.liker_avatar) {
            notification.avatar = dbNotification.metadata.liker_avatar;
          } else if (dbNotification.metadata?.owner_avatar) {
            notification.avatar = dbNotification.metadata.owner_avatar;
          } else if (dbNotification.metadata?.sender_avatar) {
            notification.avatar = dbNotification.metadata.sender_avatar;
          }

          addNotification(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated && updated.is_read) {
            // We don't have a specific markAsRead for one item in store yet, 
            // but we can just mark all as read if needed or wait for next fetch
          }
        }
      )
      .subscribe();

    return () => {
      notificationsChannel.unsubscribe();
      supabase.removeChannel(notificationsChannel);
    };
  }, [user?.id, addNotification]);

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (user?.id && isUUID) {
      supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
        if (error) logger.error('[Notifications] Failed to delete:', error);
      });
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    if (user?.id) {
       supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false).then(({ error }) => {
         if (error) logger.error('[Notifications] Failed to mark all read:', error);
       });
    }
  };

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Navigate using window.location for safety (no useNavigate dependency)
    let url: string | null = null;
    if (notification.actionUrl) {
      url = notification.actionUrl;
    } else if (notification.type === 'message' && (notification.conversationId || notification.metadata?.conversationId)) {
      const convId = notification.conversationId || notification.metadata?.conversationId;
      url = `/messages?id=${convId}`;
    }
    
    if (url) {
      try {
        window.location.href = url;
      } catch { /* silent */ }
    }
    
    // Auto-dismiss the banner on click
    handleDismiss(notification.id);
  }, [handleDismiss]);

  const markNotificationAsRead = (id: string) => {
    // Mark single notification as read locally + in DB
    const store = useNotificationStore.getState();
    store.notifications.forEach(n => { if (n.id === id) n.read = true; });
    
    if (user?.id) {
      supabase.from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) logger.error('[Notifications] Failed to mark read:', error);
        });
    }
  };

  const clearAllNotifications = () => {
    _clearAll();
    if (user?.id) {
      supabase.from('notifications')
        .delete()
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) logger.error('[Notifications] Failed to clear all:', error);
        });
    }
  };

  return {
    notifications,
    dismissNotification: handleDismiss,
    markNotificationAsRead,
    markAllAsRead: handleMarkAllAsRead,
    clearAllNotifications,
    handleNotificationClick,
    unreadCount: notifications.filter(n => !n.read).length
  };
}

