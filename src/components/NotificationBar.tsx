import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageCircle, Heart, Star, UserPlus, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const typeConfigs: Record<NotificationType, { icon: any, color: string, ring: string }> = {
  like: { icon: Heart, color: 'text-pink-500', ring: 'ring-pink-500/20' },
  match: { icon: SparklesIcon, color: 'text-[#E4007C]', ring: 'ring-[#E4007C]/20' },
  super_like: { icon: Star, color: 'text-amber-400', ring: 'ring-amber-400/20' },
  message: { icon: MessageCircle, color: 'text-blue-400', ring: 'ring-blue-400/20' },
  new_user: { icon: UserPlus, color: 'text-emerald-400', ring: 'ring-emerald-400/20' },
  premium_purchase: { icon: Crown, color: 'text-purple-400', ring: 'ring-purple-400/20' },
  activation_purchase: { icon: Zap, color: 'text-orange-400', ring: 'ring-orange-400/20' },
};

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

export function NotificationBar({ notifications, onDismiss, onMarkAllRead, onNotificationClick }: NotificationBarProps) {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const prevUnreadCountRef = useRef(0);

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (unreadCount > 0) {
      if (!dismissedRef.current || unreadCount > prevUnreadCountRef.current) {
        setVisible(true);
        dismissedRef.current = false;
        prevUnreadCountRef.current = unreadCount;

        const timer = setTimeout(() => {
          setVisible(false);
          dismissedRef.current = true;
        }, 5000); // 5 seconds visibility for better readability
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

  const currentNotification = unreadNotifications[0];
  const config = currentNotification ? typeConfigs[currentNotification.type] : typeConfigs.like;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {visible && currentNotification && (
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-2 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "pointer-events-auto flex items-center min-w-[280px] max-w-[90vw] h-12 gap-3 px-4 rounded-full",
              "bg-black/80 dark:bg-[#0e0e11]/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] cursor-pointer group"
            )}
            onClick={() => {
              onNotificationClick(currentNotification);
              handleDismiss();
            }}
          >
            {/* Visual Indicator - Glowing Circle */}
            <div className={cn("relative flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 transition-all duration-300", config.ring)}>
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
              {/* Type-specific glow */}
              <div className={cn("absolute inset-0 rounded-full blur-[6px] opacity-40 group-hover:opacity-70 transition-opacity", config.color.replace('text-', 'bg-'))} />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-[11px] font-black text-white uppercase tracking-wider leading-none mb-0.5 truncate">
                {unreadCount > 1 ? `(${unreadCount}) Swipess Alerts` : currentNotification.title}
              </h4>
              <p className="text-[10px] text-white/50 font-bold truncate leading-tight">
                {unreadCount > 1 ? 'Check your notifications center' : currentNotification.message}
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-white/40 group-hover:text-white" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
