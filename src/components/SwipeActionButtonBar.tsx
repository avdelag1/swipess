/**
 * SWIPE ACTION BUTTON BAR — Vertical Right-Side Floating Panel
 *
 * 4 icon buttons stacked vertically on the right edge of the card:
 *   1. Message  — Blue
 *   2. Insights — Green
 *   3. Share    — Violet / Purple
 *   4. Report   — Red
 *
 * Auto-hides after 3 s of inactivity; reappears on any touch/move.
 */

import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Eye, Share2, Flag } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface SwipeActionButtonBarProps {
  onMessage?: () => void;
  onInsights?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  disabled?: boolean;
  className?: string;
  // Legacy props kept for backwards compatibility — unused in new design
  onLike?: () => void;
  onDislike?: () => void;
  onUndo?: () => void;
  onSpeedMeet?: () => void;
  onCycleCategory?: () => void;
  canUndo?: boolean;
}

interface ButtonCfg {
  icon: React.ReactNode;
  color: string;
  glow: string;
  label: string;
  onClick?: () => void;
}

const AUTO_HIDE_MS = 3000;

const FloatingButton = memo(function FloatingButton({
  icon,
  color,
  glow,
  label,
  onClick,
  disabled,
  isLight,
  index,
}: {
  icon: React.ReactNode;
  color: string;
  glow: string;
  label: string;
  onClick?: () => void;
  disabled: boolean;
  isLight: boolean;
  index: number;
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || !onClick) return;
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('light');
    onClick();
  }, [disabled, onClick]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || !onClick}
      aria-label={label}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26, delay: index * 0.05 }}
      whileTap={{ scale: 0.9, transition: { type: 'spring', stiffness: 600, damping: 15 } }}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: isLight ? '#FFFFFF' : '#1A1A1A',
        border: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 8px 20px -4px ${color}44, ${glow}`,
        color,
        flexShrink: 0,
        opacity: disabled || !onClick ? 0.35 : 1,
        cursor: disabled || !onClick ? 'not-allowed' : 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      className="flex items-center justify-center touch-manipulation select-none"
    >
      {icon}
    </motion.button>
  );
});

export const SwipeActionButtonBar = memo(function SwipeActionButtonBar({
  onMessage,
  onInsights,
  onShare,
  onReport,
  disabled = false,
  className = '',
}: SwipeActionButtonBarProps) {
  const { isLight } = useAppTheme();
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetTimer]);

  // Re-show on any pointer move over the parent
  useEffect(() => {
    const handler = () => resetTimer();
    window.addEventListener('pointermove', handler, { passive: true });
    window.addEventListener('pointerdown', handler, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handler);
      window.removeEventListener('pointerdown', handler);
    };
  }, [resetTimer]);

  const buttons: ButtonCfg[] = [
    {
      icon: <MessageCircle size={20} strokeWidth={2} />,
      color: '#3B82F6',
      glow: '0 0 12px rgba(59,130,246,0.35)',
      label: 'Message',
      onClick: onMessage,
    },
    {
      icon: <Eye size={20} strokeWidth={2} />,
      color: '#22C55E',
      glow: '0 0 12px rgba(34,197,94,0.35)',
      label: 'Insights',
      onClick: onInsights,
    },
    {
      icon: <Share2 size={20} strokeWidth={2} />,
      color: '#A855F7',
      glow: '0 0 12px rgba(168,85,247,0.35)',
      label: 'Share',
      onClick: onShare,
    },
    {
      icon: <Flag size={20} strokeWidth={2} />,
      color: '#EF4444',
      glow: '0 0 12px rgba(239,68,68,0.35)',
      label: 'Report',
      onClick: onReport,
    },
  ];

  return (
    <div
      className={cn('absolute right-3 top-1/2 -translate-y-1/2 z-[55] flex flex-col gap-3 pointer-events-auto', className)}
      onPointerEnter={resetTimer}
    >
      <AnimatePresence>
        {visible && buttons.map((btn, i) => (
          <FloatingButton
            key={btn.label}
            icon={btn.icon}
            color={btn.color}
            glow={btn.glow}
            label={btn.label}
            onClick={btn.onClick}
            disabled={disabled}
            isLight={isLight}
            index={i}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

SwipeActionButtonBar.displayName = 'SwipeActionButtonBar';
