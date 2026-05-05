/**
 * SWIPE ACTION BUTTON BAR — Nexus Phantom Design
 *
 * Frameless, backgroundless floating icons with expressive shadows and glow.
 * Optimized for performance with high-fidelity visual feedback.
 *
 * BUTTON ORDER (LEFT → RIGHT):
 *   1. Return/Undo  (small) — green
 *   2. Dislike      (large) — red
 *   3. Message      (small) — blue
 *   4. Like         (large) — fire/orange
 *   5. Insights     (small) — cyan/eye
 */

import { memo, useCallback, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, MessageCircle, Flame, ThumbsDown, Eye, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { AnimatedLottieIcon } from './ui/AnimatedLottieIcon';
import useAppTheme from '@/hooks/useAppTheme';

interface SwipeActionButtonBarProps {
  onLike: () => void;
  onDislike: () => void;
  onShare?: () => void;
  onInsights?: () => void;
  onUndo?: () => void;
  onMessage?: () => void;
  onSpeedMeet?: () => void;
  onCycleCategory?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
}

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────
const ENTRY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.7 } as const;

// ── DIMENSIONS ────────────────────────────────────────────────────────────────
const LARGE_CSS = 'clamp(52px, 14vw, 60px)';
const SMALL_CSS = 'clamp(36px, 9.5vw, 42px)';
const LARGE_ICON = 30;
const SMALL_ICON = 20;
const TAP_SCALE = 0.92;

// ── VARIANT CONFIGS ───────────────────────────────────────────────────────────
type Variant = 'default' | 'like' | 'dislike' | 'amber' | 'blue' | 'cyan' | 'purple' | 'gold' | 'green';

interface VariantCfg {
  iconColor: string;
  glow: string;
  circleBg: string;
}

const VARIANTS: Record<Variant, VariantCfg> = {
  like: {
    iconColor: '#FF5722', // Fire Orange
    glow: '0 0 24px rgba(255, 87, 34, 0.45)',
    circleBg: 'rgba(255, 87, 34, 0.35)',
  },
  dislike: {
    iconColor: '#EF4444', // Red
    glow: '0 0 20px rgba(239, 68, 68, 0.4)',
    circleBg: 'rgba(239, 68, 68, 0.35)',
  },
  green: {
    iconColor: '#22C55E', // Green
    glow: '0 0 16px rgba(34, 197, 94, 0.35)',
    circleBg: 'rgba(34, 197, 94, 0.35)',
  },
  blue: {
    iconColor: '#3B82F6', // Blue
    glow: '0 0 16px rgba(59, 130, 246, 0.35)',
    circleBg: 'rgba(59, 130, 246, 0.35)',
  },
  cyan: {
    iconColor: '#06b6d4', // Cyan
    glow: '0 0 16px rgba(6, 182, 212, 0.35)',
    circleBg: 'rgba(6, 182, 212, 0.35)',
  },
  amber: {
    iconColor: '#f59e0b',
    glow: '0 0 16px rgba(245, 158, 11, 0.35)',
    circleBg: 'rgba(245, 158, 11, 0.35)',
  },
  purple: {
    iconColor: '#A855F7',
    glow: '0 0 16px rgba(168, 85, 247, 0.35)',
    circleBg: 'rgba(168, 85, 247, 0.35)',
  },
  gold: {
    iconColor: '#FFD700',
    glow: '0 0 20px rgba(255, 215, 0, 0.4)',
    circleBg: 'rgba(255, 215, 0, 0.25)',
  },
  default: {
    iconColor: 'currentColor',
    glow: '0 0 14px rgba(255,255,255,0.1)',
    circleBg: 'var(--secondary)',
  },
};

// ── ACTION BUTTON ─────────────────────────────────────────────────────────────
const ActionButton = memo(forwardRef<HTMLButtonElement, any>(function ActionButton({
  onClick,
  disabled = false,
  size = 'small',
  variant = 'default',
  children,
  ariaLabel,
  index = 0,
  isLight = false,
}: any, ref) {
  const [isPressed, setIsPressed] = useState(false);
  const cfg = VARIANTS[variant as keyof typeof VARIANTS];
  const btnSizeCss = size === 'large' ? LARGE_CSS : SMALL_CSS;
  const iconSize = size === 'large' ? LARGE_ICON : SMALL_ICON;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    if (variant === 'like') triggerHaptic('success');
    else if (variant === 'dislike') triggerHaptic('warning');
    else triggerHaptic('light');
    onClick();
  }, [disabled, variant, onClick]);

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      initial={{ opacity: 0, y: 12, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...ENTRY_SPRING, delay: index * 0.05 }}
      whileTap={{ 
        scale: TAP_SCALE,
        y: 3,
        transition: { type: 'spring', stiffness: 600, damping: 15 }
      }}
      style={{
        width: btnSizeCss,
        height: btnSizeCss,
        borderRadius: '50%',
        transform: 'translateZ(0)',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        position: 'relative',
        flexShrink: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        appearance: 'none',
        WebkitAppearance: 'none',
        boxShadow: 'none',
        color: variant === 'default' ? 'var(--foreground)' : cfg.iconColor
      }}
      className="flex items-center justify-center touch-manipulation select-none"
    >
      <div
        className="relative z-10"
        style={{
          filter: isPressed
            ? `drop-shadow(0 2px 4px ${cfg.iconColor}55)`
            : `drop-shadow(0 4px 12px ${cfg.iconColor}55)`,
          transition: 'filter 0.15s ease',
        }}
      >
        <AnimatedLottieIcon
          iconId={variant === 'like' ? 'heart' : variant === 'dislike' ? 'dislike' : variant}
          active={isPressed}
          size={iconSize}
          inactiveIcon={children}
        />
      </div>
    </motion.button>
  );
}));

(ActionButton as any).displayName = 'ActionButton';

export const SwipeActionButtonBar = memo(({
  onLike,
  onDislike,
  onInsights,
  onUndo,
  onMessage,
  canUndo = false,
  disabled = false,
  className = '',
}: SwipeActionButtonBarProps) => {
  const { isLight } = useAppTheme();

  return (
    <div className={`mx-auto flex w-auto max-w-[96vw] items-center justify-center gap-0 pointer-events-auto overflow-visible -mt-6 ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {onUndo && (
          <ActionButton
            key="action-undo"
            onClick={onUndo}
            disabled={disabled || !canUndo}
            size="small"
            variant="green"
            ariaLabel="Undo"
            index={0}
            isLight={isLight}
          >
            <RotateCcw className="w-full h-full" strokeWidth={2} />
          </ActionButton>
        )}
        <ActionButton
          key="action-dislike"
          onClick={onDislike}
          disabled={disabled}
          size="large"
          variant="dislike"
          ariaLabel="Dislike"
          index={1}
          isLight={isLight}
        >
          <ThumbsDown className="w-full h-full" strokeWidth={2} />
        </ActionButton>
        {onMessage && (
          <ActionButton
            key="action-message"
            onClick={onMessage}
            disabled={disabled}
            size="small"
            variant="blue"
            ariaLabel="Message"
            index={2}
            isLight={isLight}
          >
            <MessageCircle className="w-full h-full" strokeWidth={2} />
          </ActionButton>
        )}
        <ActionButton
          key="action-like"
          onClick={onLike}
          disabled={disabled}
          size="large"
          variant="like"
          ariaLabel="Like"
          index={3}
          isLight={isLight}
        >
          <Flame className="w-full h-full" fill="currentColor" strokeWidth={0} />
        </ActionButton>
        {onInsights && (
          <ActionButton
            key="action-insights"
            onClick={onInsights}
            disabled={disabled}
            size="small"
            variant="cyan"
            ariaLabel="Insights"
            index={4}
            isLight={isLight}
          >
            <Eye className="w-full h-full" strokeWidth={2} />
          </ActionButton>
        )}
      </AnimatePresence>
    </div>
  );
});

SwipeActionButtonBar.displayName = 'SwipeActionButtonBar';
