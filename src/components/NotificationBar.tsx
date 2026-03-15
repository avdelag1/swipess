import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ThumbsUp, Star, UserPlus, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

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

const typeConfigs: Record<NotificationType, { icon: any; accentColor: string; glowColor: string }> = {
  like:                { icon: ThumbsUp,    accentColor: '#ec4899', glowColor: 'rgba(236,72,153,0.35)' },
  match:               { icon: SparklesIcon, accentColor: '#E4007C', glowColor: 'rgba(228,0,124,0.35)' },
  super_like:          { icon: Star,         accentColor: '#fbbf24', glowColor: 'rgba(251,191,36,0.35)' },
  message:             { icon: MessageCircle,accentColor: '#60a5fa', glowColor: 'rgba(96,165,250,0.35)' },
  new_user:            { icon: UserPlus,     accentColor: '#34d399', glowColor: 'rgba(52,211,153,0.35)' },
  premium_purchase:    { icon: Crown,        accentColor: '#a78bfa', glowColor: 'rgba(167,139,250,0.35)' },
  activation_purchase: { icon: Zap,          accentColor: '#fb923c', glowColor: 'rgba(251,146,60,0.35)' },
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        }, 5000);
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
          className="fixed top-14 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pointer-events-auto flex items-stretch min-w-[300px] max-w-[92vw] rounded-2xl overflow-hidden cursor-pointer group"
            style={{
              background: isDark
                ? 'rgba(14,14,17,0.92)'
                : 'rgba(255,255,255,0.95)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? `0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${config.glowColor}`
                : `0 8px 30px rgba(0,0,0,0.15), 0 0 16px ${config.glowColor}`,
            }}
            onClick={() => {
              onNotificationClick(currentNotification);
              handleDismiss();
            }}
          >
            {/* Left accent bar — type-specific color */}
            <div
              className="w-1 flex-shrink-0"
              style={{ background: config.accentColor }}
            />

            {/* Content area */}
            <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
              {/* Icon circle */}
              <div
                className="relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: isDark
                    ? `${config.accentColor}18`
                    : `${config.accentColor}12`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,${isDark ? 0.08 : 0.4})`,
                }}
              >
                <Icon
                  className="w-4.5 h-4.5"
                  style={{ color: config.accentColor, width: 18, height: 18 }}
                />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h4 className={cn(
                  "text-xs font-black uppercase tracking-wide leading-none mb-1 truncate",
                  isDark ? "text-foreground" : "text-foreground"
                )}>
                  {unreadCount > 1 ? `${unreadCount} New Alerts` : currentNotification.title}
                </h4>
                <p className={cn(
                  "text-[11px] font-semibold truncate leading-tight",
                  isDark ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {unreadCount > 1 ? 'Tap to view your notifications' : currentNotification.message}
                </p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                  isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/8 hover:bg-black/15"
                )}
                aria-label="Dismiss"
              >
                <X className={cn("w-3.5 h-3.5", isDark ? "text-muted-foreground group-hover:text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
