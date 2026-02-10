import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

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
  metadata?: {
    role?: 'client' | 'owner';
    targetType?: 'listing' | 'profile';
    [key: string]: any;
  };
}

interface NotificationBarProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export function NotificationBar({ notifications, onDismiss, onMarkAllRead, onNotificationClick }: NotificationBarProps) {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const prevUnreadCountRef = useRef(0);

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (unreadCount > 0) {
      // Show banner only on first appearance or when genuinely new notifications arrive
      if (!dismissedRef.current || unreadCount > prevUnreadCountRef.current) {
        setVisible(true);
        dismissedRef.current = false;
        prevUnreadCountRef.current = unreadCount;

        const timer = setTimeout(() => {
          setVisible(false);
          dismissedRef.current = true;
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
      dismissedRef.current = false;
      prevUnreadCountRef.current = 0;
    }
  }, [unreadCount]);

  const handleDismiss = () => {
    setVisible(false);
    dismissedRef.current = true;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -36, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed top-14 left-0 right-0 z-40 px-3 sm:px-4"
        >
          <div
            className="mx-auto max-w-sm flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-900/92 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:bg-gray-900 transition-colors"
            onClick={() => {
              if (unreadNotifications.length > 0) {
                onNotificationClick(unreadNotifications[0]);
              }
              handleDismiss();
            }}
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Bell className="w-3 h-3 text-primary" />
            </div>
            <p className="flex-1 text-xs text-white font-medium truncate">
              {unreadCount === 1
                ? unreadNotifications[0].title
                : `${unreadCount} new notifications`}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
