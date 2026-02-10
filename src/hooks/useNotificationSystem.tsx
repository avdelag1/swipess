import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/prodLogger';
import { useProfileCache } from '@/hooks/useProfileCache';

type NotificationType = 'like' | 'message' | 'super_like' | 'match' | 'new_user' | 'premium_purchase' | 'activation_purchase';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  relatedUserId?: string;
  conversationId?: string;
  metadata?: {
    role?: 'client' | 'owner';
    targetType?: 'listing' | 'profile';
    [key: string]: any;
  };
}

// DBNotification matches actual Supabase schema
interface DBNotification {
  id: string;
  user_id: string;
  notification_type: string;  // Actual column name
  message: string;
  is_read: boolean;           // Actual column name
  created_at: string;
  title?: string;
  link_url?: string;
  related_user_id?: string;
  metadata?: any;
}

export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // OPTIMIZATION: Batch notifications to reduce re-renders
  const [pendingNotifications, setPendingNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getProfile } = useProfileCache();

  // OPTIMIZATION: Batch pending notifications every 100ms to reduce re-renders
  useEffect(() => {
    if (pendingNotifications.length === 0) return;

    const timeoutId = setTimeout(() => {
      setNotifications(prev => [...pendingNotifications, ...prev]);
      setPendingNotifications([]);
    }, 100); // Batch within 100ms

    return () => clearTimeout(timeoutId);
  }, [pendingNotifications]);

  // Fetch existing notifications from database on mount
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

        const formattedNotifications: Notification[] = (data as DBNotification[]).map((notif) => {
          const frontendType = notificationTypeMap[notif.notification_type] || 'like';
          // Generate title from type since DB schema doesn't have title column
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
          return {
            id: notif.id,
            type: frontendType,
            title: notif.title || titleMap[notif.notification_type] || 'Notification',
            message: notif.message || '',
            timestamp: new Date(notif.created_at),
            read: notif.is_read || false,
            actionUrl: notif.link_url,
            relatedUserId: notif.related_user_id,
            avatar: undefined,
            metadata: notif.metadata || {},
          };
        });
        setNotifications(formattedNotifications);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // Subscribe to real-time notifications from the notifications table
  // Database triggers automatically create notifications for likes, messages, matches
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to notifications table - this receives all notification types
    // Database triggers insert notifications for: likes, messages, matches
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

          // Map database notification to frontend format
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

          const notification: Notification = {
            id: dbNotification.id,
            type: notificationTypeMap[dbNotification.notification_type] || 'like',
            title: dbNotification.title || 'Notification',
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

          // OPTIMIZATION: Add to pending queue instead of immediate state update
          setPendingNotifications(prev => [...prev, notification]);
        }
      )
      .subscribe();

    return () => {
      // Properly unsubscribe before removing channel to prevent memory leaks
      notificationsChannel.unsubscribe();
    };
  }, [user?.id]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Persist to DB so the bell badge (useUnreadNotifications) clears via realtime
    if (user?.id) {
      Promise.resolve(
        (supabase as any)
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
      ).catch(() => {});
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate to appropriate page
    if (notification.actionUrl) {
      if (notification.type === 'message' && notification.conversationId) {
        navigate(`/messages?conversationId=${notification.conversationId}`);
      } else {
        navigate(notification.actionUrl);
      }
    }
  };

  return {
    notifications,
    dismissNotification,
    markAllAsRead,
    handleNotificationClick,
    unreadCount: notifications.filter(n => !n.read).length
  };
}