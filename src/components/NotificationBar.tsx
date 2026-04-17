import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, MessageCircle, ThumbsUp, Star, UserPlus, Zap, Crown } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';

import { notificationTypeConfigs as typeConfigs } from '@/utils/notificationConfigs';
import type { Notification } from '@/state/notificationStore';

interface NotificationBarProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notif: Notification) => void;
}

export const NotificationBar = memo(function NotificationBar({ notifications, onDismiss, onMarkAllRead: _onMarkAllRead, onNotificationClick }: NotificationBarProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const [exitDir, setExitDir] = useState<'right' | 'left'>('right');

  const timerRef   = useRef<ReturnType<typeof setTimeout>>();
  const isExiting  = useRef(false);
  const pendingRef = useRef<Notification | null>(null);

  // Swipe logic
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  const unread = useMemo(
    () => notifications.filter(n => !n.read),
    [notifications],
  );

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
  }, [unread.map(n => n.id).join(',')]);

  const showNotification = useCallback((notif: Notification) => {
    clearTimeout(timerRef.current);
    setCurrent(notif);
    setVisible(true);
    x.set(0); // Reset swipe position
    timerRef.current = setTimeout(() => startDismiss('right'), 4000);
  }, [x]);

  const startDismiss = useCallback((dir: 'right' | 'left' = 'right') => {
    if (isExiting.current) return;
    isExiting.current = true;
    setExitDir(dir);
    clearTimeout(timerRef.current);
    setVisible(false);
    triggerHaptic('light');
  }, []);

  const handleDragEnd = useCallback((_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      startDismiss('right');
    } else if (info.offset.x < -threshold) {
      startDismiss('left');
    }
  }, [startDismiss]);

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
    x.set(0); 
  }, [current, onDismiss, showNotification, x]);

  if (!current) return null;

  const config = typeConfigs[current.type] ?? typeConfigs.like;
  const Icon   = config.icon;
  const unreadCount = unread.length;

  return (
    <div className="fixed z-[99999] px-4 flex justify-center pointer-events-none left-0 right-0" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key={current.id}
            drag="x"
            dragConstraints={{ left: -200, right: 200 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            onDrag={() => { if (Math.abs(x.get()) > 10) triggerHaptic('light'); }}
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ 
              x: exitDir === 'right' ? 200 : -200, 
              opacity: 0, 
              scale: 0.95,
              transition: { duration: 0.2, ease: "easeIn" }
            }}
            transition={{
              y:       { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
              scale:   { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
              opacity: { type: 'tween', duration: 0.15 },
            }}
            whileTap={{ scale: 0.98 }}
            className="pointer-events-auto w-full max-w-[400px] rounded-[24px] overflow-hidden cursor-pointer touch-pan-x"
            style={{ 
              x, 
              opacity,
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,24,0.92)',
              border: isLight ? `1px solid rgba(0,0,0,0.08)` : `1px solid ${config.accentColor}33`,
              boxShadow: isLight
                ? `0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)`
                : `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${config.accentColor}15`,
              backdropFilter: 'blur(30px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(30px) saturate(1.6)',
            }}
            onClick={() => {
              triggerHaptic('medium');
              onNotificationClick(current);
              startDismiss('right');
            }}
          >
            <div className="flex items-center gap-4 pl-5 pr-4 py-4">
              {/* Icon chip */}
              <div
                className="flex-shrink-0 w-11 h-11 rounded-[16px] flex items-center justify-center shadow-inner"
                style={{ background: config.bg }}
              >
                <Icon style={{ color: config.accentColor, width: 22, height: 22 }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-black leading-tight mb-0.5 truncate tracking-tight"
                  style={{ color: isLight ? '#000' : '#fff' }}
                >
                  {unreadCount > 1 ? `${unreadCount} new notifications` : current.title}
                </p>
                <p className="text-[13px] truncate leading-snug font-medium" style={{ color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}>
                  {unreadCount > 1 ? 'Tap to see all' : current.message}
                </p>
              </div>

              {/* Dismiss button — ENLARGED TOUCH TARGET */}
              <button
                onClick={(e) => { e.stopPropagation(); startDismiss('right'); }}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" style={{ color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
