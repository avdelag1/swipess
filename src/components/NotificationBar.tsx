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

const typeConfigs: Record<NotificationType, { icon: any; accentColor: string; bg: string }> = {
  like:                { icon: ThumbsUp,      accentColor: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  match:               { icon: SparklesIcon,  accentColor: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  super_like:          { icon: Star,          accentColor: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  message:             { icon: MessageCircle, accentColor: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  new_user:            { icon: UserPlus,      accentColor: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  premium_purchase:    { icon: Crown,         accentColor: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  activation_purchase: { icon: Zap,           accentColor: '#f97316', bg: 'rgba(249,115,22,0.12)' },
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
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  // Track exit direction — default is always 'right' (slides out to the right)
  const [exitDir, setExitDir] = useState<'up' | 'right'>('right');

  const timerRef   = useRef<ReturnType<typeof setTimeout>>();
  const isExiting  = useRef(false);
  const pendingRef = useRef<Notification | null>(null);

  const unread = useMemo(
    () => notifications.filter(n => !n.read),
    [notifications],
  );

  // ─── TRIGGER: show when a new unread arrives ─────────────────────────────
  useEffect(() => {
    const next = unread[0];
    if (!next) {
      if (visible) startDismiss('right');
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
    // Auto-dismiss after 4s — exits to the right
    timerRef.current = setTimeout(() => startDismiss('right'), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDismiss = useCallback((dir: 'up' | 'right' = 'right') => {
    if (isExiting.current) return;
    isExiting.current = true;
    setExitDir(dir);
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const handleExitComplete = useCallback(() => {
    isExiting.current = false;
    if (current) onDismiss(current.id);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) {
      setTimeout(() => showNotification(pending), 150);
    } else {
      setCurrent(null);
    }
  }, [current, onDismiss, showNotification]);

  if (!current) return null;

  const config = typeConfigs[current.type] ?? typeConfigs.like;
  const Icon   = config.icon;
  const unreadCount = unread.length;

  // Animation: enters from left, exits right (default) or up (swipe up)
  const exitVariant = exitDir === 'up'
    ? { y: '-130%', opacity: 0, transition: { type: 'spring' as const, stiffness: 500, damping: 38 } }
    : { x: '115%',  opacity: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 36 } };

  return (
    <div className="fixed top-16 left-0 right-0 z-[150] px-3 flex justify-center pointer-events-none">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key={current.id}
            // Slides in from the LEFT, rests centered, exits to the RIGHT
            initial={{ x: '-115%', opacity: 0, scale: 0.94 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={exitVariant}
            transition={{
              x:       { type: 'spring', stiffness: 420, damping: 38, mass: 0.75 },
              scale:   { type: 'spring', stiffness: 420, damping: 38, mass: 0.75 },
              opacity: { type: 'tween', duration: 0.12, ease: 'easeOut' },
            }}
            // ── SWIPE TO DISMISS ─────────────────────────────────────────────
            drag
            dragDirectionLock={false}
            dragConstraints={{ left: -16, right: 600, top: -600, bottom: 16 }}
            dragElastic={{ left: 0.03, right: 0.12, top: 0.18, bottom: 0.02 }}
            dragMomentum={false}
            onDrag={(_, info) => {
              if (isExiting.current) return;
              if (info.offset.y < -24) startDismiss('up');
              else if (info.offset.x > 44) startDismiss('right');
            }}
            onDragEnd={(_, info) => {
              if (isExiting.current) return;
              if (info.offset.y < -14) startDismiss('up');
              else if (info.offset.x > 20) startDismiss('right');
            }}
            whileTap={{ scale: 0.978 }}
            className="pointer-events-auto w-full max-w-[400px] rounded-2xl overflow-hidden cursor-pointer"
            style={{
              background: 'rgba(15,15,15,0.92)',
              border: `1px solid ${config.accentColor}28`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px ${config.accentColor}18, 0 4px 12px ${config.accentColor}18`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
            onClick={() => {
              onNotificationClick(current);
              startDismiss('right');
            }}
          >
            {/* Left accent stripe — type-specific color */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ background: config.accentColor }}
            />

            <div className="flex items-center gap-3 pl-5 pr-3 py-3">
              {/* Icon chip */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: config.bg }}
              >
                <Icon style={{ color: config.accentColor, width: 17, height: 17 }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-bold leading-tight mb-0.5 truncate text-white"
                >
                  {unreadCount > 1 ? `${unreadCount} new notifications` : current.title}
                </p>
                <p className="text-[12px] truncate leading-snug text-white/50">
                  {unreadCount > 1 ? 'Tap to see all' : current.message}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={(e) => { e.stopPropagation(); startDismiss('right'); }}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
