import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageCircle, Heart, Star, UserPlus, Zap, Crown } from 'lucide-react';
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

const typeConfigs: Record<NotificationType, { icon: any, color: string, glow: string }> = {
  like: { icon: Heart, color: 'text-[#E4007C]', glow: 'shadow-[#E4007C]/40' },
  match: { icon: SparklesIcon, color: 'text-[#E4007C]', glow: 'shadow-[#E4007C]/50' },
  super_like: { icon: Star, color: 'text-amber-400', glow: 'shadow-amber-400/40' },
  message: { icon: MessageCircle, color: 'text-blue-400', glow: 'shadow-blue-400/40' },
  new_user: { icon: UserPlus, color: 'text-white', glow: 'shadow-white/20' },
  premium_purchase: { icon: Crown, color: 'text-amber-400', glow: 'shadow-amber-400/50' },
  activation_purchase: { icon: Zap, color: 'text-amber-400', glow: 'shadow-amber-400/40' },
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
  const isDark = theme !== 'white-matte';

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (unreadCount > 0) {
      if (!dismissedRef.current || unreadCount > prevUnreadCountRef.current) {
        // SMALL DELAY TO ENSURE EXIT OF PREVIOUS IF RAPID FIRE
        setTimeout(() => {
          setVisible(true);
          dismissedRef.current = false;
          prevUnreadCountRef.current = unreadCount;
        }, 100);

        const timer = setTimeout(() => {
          setVisible(false);
          dismissedRef.current = true;
        }, 6000);
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
    <AnimatePresence mode="wait">
      {visible && currentNotification && (
        <motion.div
          key={currentNotification.id}
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            mass: 0.8
          }}
          className="fixed top-4 left-0 right-0 z-[999] px-4 flex justify-center pointer-events-none"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "pointer-events-auto flex items-center min-w-[300px] max-w-[95vw] sm:max-w-md h-16 gap-4 px-5 rounded-[2rem] transition-all duration-300 cursor-pointer group",
              "bg-black/90 dark:bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
              !isDark && "bg-white/95 border-black/10 shadow-[0_15px_40px_rgba(0,0,0,0.15)]"
            )}
            onClick={() => {
              onNotificationClick(currentNotification);
              handleDismiss();
            }}
          >
            {/* Elite Badge - High-end Glowing Icon */}
            <div className={cn(
              "relative flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
              "bg-gradient-to-br from-white/10 to-transparent border border-white/5",
              config.glow
            )}>
              <Icon className={cn("w-5 h-5", config.color)} />
              <div className={cn("absolute inset-0 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity", config.color.replace('text-', 'bg-'))} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-black/40")}>
                  {unreadCount > 1 ? `(${unreadCount}) Swipess Alerts` : "Incoming Alert"}
                </span>
                {currentNotification.type === 'match' && (
                  <div className="px-1.5 py-0.5 rounded-full bg-[#E4007C] text-white text-[8px] font-black uppercase">Instant</div>
                )}
              </div>
              <h4 className={cn("text-xs font-black truncate leading-tight", isDark ? "text-white" : "text-black")}>
                {unreadCount > 1 ? 'New interactions waiting' : currentNotification.title}
              </h4>
              <p className={cn("text-[11px] font-medium truncate opacity-60 leading-tight mt-0.5", isDark ? "text-white" : "text-black")}>
                {unreadCount > 1 ? 'Check your notifications center to see details' : currentNotification.message}
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
              )}
            >
              <X className={cn("w-4 h-4", isDark ? "text-white/40 group-hover:text-white" : "text-black/40 group-hover:text-black")} />
            </button>

            {/* Premium Progress Bar (Visual only) */}
            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-white/5 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className={cn("h-full bg-gradient-to-r", config.color.replace('text-', 'from-'), "to-transparent opacity-60")}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
