import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

const typeConfigs: Record<NotificationType, { icon: any; accentColor: string }> = {
  like:                { icon: ThumbsUp,     accentColor: '#ec4899' },
  match:               { icon: SparklesIcon, accentColor: 'var(--color-brand-accent-2)' },
  super_like:          { icon: Star,         accentColor: '#fbbf24' },
  message:             { icon: MessageCircle,accentColor: '#60a5fa' },
  new_user:            { icon: UserPlus,     accentColor: '#34d399' },
  premium_purchase:    { icon: Crown,        accentColor: '#a78bfa' },
  activation_purchase: { icon: Zap,          accentColor: '#fb923c' },
};

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

export function NotificationBar({ notifications, onDismiss, onMarkAllRead: _onMarkAllRead, onNotificationClick }: NotificationBarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ─── SNAPSHOT PATTERN ───────────────────────────────────────────────────────
  // "current" is the notification we are CURRENTLY displaying.
  // It is set once when we decide to show it and never changed until after the
  // exit animation fully completes.  This prevents the card content from
  // switching mid-animation (which caused the "two notifications at once" bug).
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  // Refs — no re-renders needed for these
  const timerRef   = useRef<ReturnType<typeof setTimeout>>();
  const isExiting  = useRef(false);   // true while the exit animation is running
  const pendingRef = useRef<Notification | null>(null); // queued next notification

  const unread = useMemo(
    () => notifications.filter(n => !n.read),
    [notifications],
  );

  // ─── TRIGGER: show when a new unread arrives ─────────────────────────────
  useEffect(() => {
    const next = unread[0];

    if (!next) {
      // Nothing left — start dismissal if still visible
      if (visible) startDismiss();
      return;
    }

    // Already showing this exact notification — do nothing
    if (current?.id === next.id && visible) return;

    // Mid-exit — remember the next one for after the animation
    if (isExiting.current) {
      pendingRef.current = next;
      return;
    }

    // Show the new notification
    showNotification(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.map(n => n.id).join(',')]);

  const showNotification = useCallback((notif: Notification) => {
    clearTimeout(timerRef.current);
    setCurrent(notif);
    setVisible(true);
    // Auto-dismiss after 5 s
    timerRef.current = setTimeout(() => startDismiss(), 5000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDismiss = useCallback(() => {
    if (isExiting.current) return; // already dismissing
    isExiting.current = true;
    clearTimeout(timerRef.current);
    setVisible(false);
    // NOTE: we do NOT call onDismiss here — we wait for the exit animation
    //       to finish so the card content stays frozen during the slide-out.
  }, []);

  // Called by AnimatePresence once the exit animation is 100% done
  const handleExitComplete = useCallback(() => {
    isExiting.current = false;

    // NOW tell the parent to mark this notification read
    if (current) onDismiss(current.id);

    const pending = pendingRef.current;
    pendingRef.current = null;

    if (pending) {
      // Show the queued notification after a brief breath
      setTimeout(() => showNotification(pending), 200);
    } else {
      setCurrent(null);
    }
  }, [current, onDismiss, showNotification]);

  // ─── UI ─────────────────────────────────────────────────────────────────────
  if (!current) return null;

  const config = typeConfigs[current.type] ?? typeConfigs.like;
  const Icon   = config.icon;

  const unreadCount = unread.length;

  return (
    // Fixed container: always mounted, provides centering — not animated itself
    <div className="fixed top-14 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key={current.id}
            // Slides in from fully off-screen left, rests in center, exits to fully off-screen right
            initial={{ x: '-110%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '110%', opacity: 0 }}
            transition={{
              x:       { type: 'spring', stiffness: 420, damping: 38, mass: 1 },
              opacity: { type: 'tween', duration: 0.18, ease: 'easeOut' },
            }}
            // ── SWIPE-RIGHT-TO-DISMISS ──────────────────────────────────────
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: -10, right: 300 }}
            dragElastic={{ left: 0.05, right: 0.25 }}
            onDrag={(_, info) => {
              if (info.offset.x > 60 && !isExiting.current) {
                startDismiss();
              }
            }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 30 && !isExiting.current) startDismiss();
            }}
            whileTap={{ scale: 0.985 }}
            className="pointer-events-auto flex items-stretch min-w-[300px] max-w-[92vw] rounded-2xl overflow-hidden cursor-pointer"
            style={{
              background: isDark ? 'rgba(20,20,24,0.97)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              boxShadow: isDark
                ? '0 8px 28px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)'
                : '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={() => {
              onNotificationClick(current);
              startDismiss();
            }}
          >
            {/* Left accent stripe */}
            <div className="w-[3px] flex-shrink-0" style={{ background: config.accentColor }} />

            {/* Content */}
            <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
              {/* Icon chip */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${config.accentColor}18` }}
              >
                <Icon style={{ color: config.accentColor, width: 17, height: 17 }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[13px] font-semibold leading-tight mb-0.5 truncate text-foreground">
                  {unreadCount > 1 ? `${unreadCount} new notifications` : current.title}
                </p>
                <p className="text-[12px] truncate leading-snug text-muted-foreground">
                  {unreadCount > 1 ? 'Tap to see all' : current.message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => { e.stopPropagation(); startDismiss(); }}
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                  isDark ? "hover:bg-white/10 active:bg-white/15" : "hover:bg-black/5 active:bg-black/10",
                )}
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
