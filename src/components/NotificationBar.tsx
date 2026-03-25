import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ThumbsUp, Star, UserPlus, Zap, Crown } from 'lucide-react';

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
  match:               { icon: SparklesIcon, accentColor: '#8b5cf6' },
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
  // ─── SNAPSHOT PATTERN ───────────────────────────────────────────────────────
  // "current" is the notification we are CURRENTLY displaying.
  // It is set once when we decide to show it and never changed until after the
  // exit animation fully completes.
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  // Track which direction to exit so the animation matches the swipe gesture
  const [exitDir, setExitDir] = useState<'up' | 'right'>('up');

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
      if (visible) startDismiss('up');
      return;
    }
    if (current?.id === next.id && visible) return;
    if (isExiting.current) {
      pendingRef.current = next;
      return;
    }
    showNotification(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.map(n => n.id).join(',')]);

  const showNotification = useCallback((notif: Notification) => {
    clearTimeout(timerRef.current);
    setCurrent(notif);
    setVisible(true);
    // Auto-dismiss after 5 s — exits upward like iOS
    timerRef.current = setTimeout(() => startDismiss('up'), 5000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDismiss = useCallback((dir: 'up' | 'right' = 'up') => {
    if (isExiting.current) return; // already dismissing
    isExiting.current = true;
    // Set exit direction BEFORE setVisible(false) so the exit animation
    // sees the correct direction (React 18 batches these together).
    setExitDir(dir);
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  // Called by AnimatePresence once the exit animation is 100% done
  const handleExitComplete = useCallback(() => {
    isExiting.current = false;
    if (current) onDismiss(current.id);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) {
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

  // Exit variants per direction
  const exitVariant = exitDir === 'up'
    ? { y: '-140%', opacity: 0 }
    : { x: '110%',  opacity: 0 };

  return (
    // Fixed container: always mounted, provides centering — not animated itself
    <div className="fixed top-14 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key={current.id}
            // Slides in from above (top of screen), rests in center
            initial={{ y: '-120%', opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={exitVariant}
            transition={{
              y:       { type: 'spring', stiffness: 520, damping: 40, mass: 0.85 },
              x:       { type: 'spring', stiffness: 520, damping: 40, mass: 0.85 },
              scale:   { type: 'spring', stiffness: 520, damping: 40, mass: 0.85 },
              opacity: { type: 'tween', duration: 0.14, ease: 'easeOut' },
            }}
            // ── SWIPE TO DISMISS (up or right) ──────────────────────────────
            // dragMomentum=false makes the card stop instantly when finger lifts
            // — no inertia, pure 1-to-1 finger tracking
            drag
            dragDirectionLock={false}
            dragConstraints={{ left: -10, right: 400, top: -400, bottom: 20 }}
            dragElastic={{ left: 0.02, right: 0.1, top: 0.18, bottom: 0.02 }}
            dragMomentum={false}
            onDrag={(_, info) => {
              if (isExiting.current) return;
              // Very low thresholds for instant response
              if (info.offset.y < -22) startDismiss('up');
              else if (info.offset.x > 42) startDismiss('right');
            }}
            onDragEnd={(_, info) => {
              if (isExiting.current) return;
              if (info.offset.y < -12) startDismiss('up');
              else if (info.offset.x > 18) startDismiss('right');
            }}
            whileTap={{ scale: 0.982 }}
            className="pointer-events-auto flex items-stretch min-w-[300px] max-w-[92vw] rounded-2xl overflow-hidden cursor-pointer"
            style={{
              // Always pure white — adapts to any background theme
              background: '#ffffff',
              border: '1px solid rgba(249,115,22,0.14)',
              boxShadow: '0 8px 32px rgba(249,115,22,0.20), 0 2px 10px rgba(0,0,0,0.07)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={() => {
              onNotificationClick(current);
              startDismiss('up');
            }}
          >
            {/* Left gradient accent stripe — orange-pink-purple always */}
            <div
              className="w-[3.5px] flex-shrink-0"
              style={{ background: 'linear-gradient(180deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)' }}
            />

            {/* Content */}
            <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
              {/* Icon chip — warm tint bg, keeps type-specific icon color */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,0.09)' }}
              >
                <Icon style={{ color: config.accentColor, width: 17, height: 17 }} />
              </div>

              {/* Text — bright orange gradient */}
              <div className="flex-1 min-w-0 pr-1">
                <p
                  className="text-[13px] font-bold leading-tight mb-0.5 truncate"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {unreadCount > 1 ? `${unreadCount} new notifications` : current.title}
                </p>
                <p
                  className="text-[12px] truncate leading-snug"
                  style={{
                    background: 'linear-gradient(135deg, #fb923c 0%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {unreadCount > 1 ? 'Tap to see all' : current.message}
                </p>
              </div>

              {/* Close button — orange tint */}
              <button
                onClick={(e) => { e.stopPropagation(); startDismiss('up'); }}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-50 active:bg-orange-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
