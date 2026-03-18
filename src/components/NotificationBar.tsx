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
  match:               { icon: SparklesIcon, accentColor: 'var(--color-brand-accent-2)', glowColor: 'rgba(228,0,124,0.35)' },
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
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const dismissedRef = useRef(false);
  const prevUnreadCountRef = useRef(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (unreadCount > 0 && !isCoolingDown) {
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
    } else if (unreadCount === 0) {
      setVisible(false);
      dismissedRef.current = false;
      prevUnreadCountRef.current = 0;
    }
  }, [unreadCount, isCoolingDown]);

  const handleDismiss = () => {
    setVisible(false);
    dismissedRef.current = true;
    // Cooldown prevents the next notification from immediately overlapping
    setIsCoolingDown(true);
    setTimeout(() => setIsCoolingDown(false), 700);
    if (unreadNotifications[0]) {
      onDismiss(unreadNotifications[0].id);
    }
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
            drag="y"
            dragConstraints={{ top: -80, bottom: 0 }}
            dragElastic={{ top: 0.4, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y < -30) handleDismiss(); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pointer-events-auto flex items-stretch min-w-[300px] max-w-[92vw] rounded-2xl overflow-hidden cursor-pointer group backdrop-blur-xl"
            style={{
              background: isDark
                ? 'rgba(24,24,28,0.95)'
                : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
                : '0 4px 12px rgba(0,0,0,0.05)',
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
                className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: isDark
                    ? `${config.accentColor}15`
                    : `${config.accentColor}10`,
                }}
              >
                <Icon
                  className="w-4.5 h-4.5"
                  style={{ color: config.accentColor, width: 17, height: 17 }}
                />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-[13px] font-semibold leading-tight mb-0.5 truncate text-foreground">
                  {unreadCount > 1 ? `${unreadCount} New Notifications` : currentNotification.title}
                </h4>
                <p className="text-[12px] font-normal truncate leading-snug text-muted-foreground">
                  {unreadCount > 1 ? 'Tap to view your notifications' : currentNotification.message}
                </p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                )}
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
