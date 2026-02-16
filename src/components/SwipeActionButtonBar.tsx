/**
 * SWIPE ACTION BUTTON BAR - PREMIUM 2025 DESIGN
 *
 * Modern floating button bar for swipe cards with premium aesthetics.
 * Designed to feel like buttons "emerge from the gradient" rather than
 * sitting on transparent backgrounds.
 *
 * Features:
 * - PILL-SHAPED buttons with soft, premium rounded corners
 * - Subtle backdrop blur (not heavy frosted glass)
 * - Color-coded variants that glow softly on press
 * - GPU-accelerated animations at 60fps
 * - Large touch-first hit areas (invisible padding extends target)
 * - Minimal chrome - no heavy shadows or cartoon effects
 * - Micro-interactions on press for premium feedback
 *
 * BUTTON ORDER (LEFT → RIGHT):
 * 1. Return/Undo (small) - amber icon
 * 2. Dislike (large) - red thumbs down icon
 * 3. Share (small) - purple icon
 * 4. Like (large) - green heart icon
 * 5. Message/Chat (small) - cyan icon
 */

import { memo, useCallback, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, MessageCircle, Heart, ThumbsDown } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

interface SwipeActionButtonBarProps {
  onLike: () => void;
  onDislike: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onMessage?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
}

// Premium spring animation - soft, bouncy, modern
const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.6,
} as const;

/**
 * BUTTON SIZING SYSTEM - Premium 2025
 *
 * Large touch-first buttons with generous hit areas.
 * Size hierarchy creates clear visual prominence.
 */
const LARGE_SIZE = 64;  // Primary actions (Like/Dislike) - touch targets
const SMALL_SIZE = 48;  // Secondary actions

// Icon sizes - BIGGER for floating icon style
const LARGE_ICON_SIZE = 40;  // Primary icons - bold and visible
const SMALL_ICON_SIZE = 28;  // Secondary icons - clear

// Gap between buttons - tighter grouping
const BUTTON_GAP = 6;

// Tap animation - subtle premium press
const TAP_SCALE = 0.88;

/**
 * Premium ActionButton - Modern Pill-Shaped Design
 *
 * Buttons appear to "emerge from the gradient" with subtle glass effect.
 * No heavy chrome or cartoon shadows - clean, premium, modern.
 */
const ActionButton = memo(({
  onClick,
  disabled = false,
  size = 'small',
  variant = 'default',
  children,
  ariaLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'large';
  variant?: 'default' | 'like' | 'dislike' | 'amber' | 'cyan' | 'purple';
  children: React.ReactNode;
  ariaLabel: string;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    // CRITICAL: Stop event from bubbling to parent card's onClick
    e.stopPropagation();
    e.preventDefault();

    // Haptic feedback - stronger for primary actions
    if (variant === 'like') {
      triggerHaptic('success');
    } else if (variant === 'dislike') {
      triggerHaptic('warning');
    } else {
      triggerHaptic('light');
    }

    onClick();
  }, [disabled, variant, onClick]);

  // Compute sizes
  const buttonSize = size === 'large' ? LARGE_SIZE : SMALL_SIZE;
  const iconSize = size === 'large' ? LARGE_ICON_SIZE : SMALL_ICON_SIZE;
  const isPrimary = size === 'large';

  // Premium color configurations - TINDER STYLE with transparent backgrounds
  // Only borders and icons provide visual definition, gradient overlay does the rest
  const variantConfig = useMemo(() => {
    const configs: Record<string, {
      iconColor: string;
      bgColor: string;
      pressedBg: string;
      glowColor: string;
      borderColor: string;
    }> = {
      like: {
        iconColor: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.08)',
        pressedBg: 'rgba(34, 197, 94, 0.20)',
        glowColor: 'rgba(34, 197, 94, 0.4)',
        borderColor: 'rgba(34, 197, 94, 0.35)',
      },
      dislike: {
        iconColor: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.08)',
        pressedBg: 'rgba(239, 68, 68, 0.20)',
        glowColor: 'rgba(239, 68, 68, 0.4)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      },
      amber: {
        iconColor: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.06)',
        pressedBg: 'rgba(245, 158, 11, 0.18)',
        glowColor: 'rgba(245, 158, 11, 0.35)',
        borderColor: 'rgba(245, 158, 11, 0.30)',
      },
      cyan: {
        iconColor: '#06b6d4',
        bgColor: 'rgba(6, 182, 212, 0.06)',
        pressedBg: 'rgba(6, 182, 212, 0.18)',
        glowColor: 'rgba(6, 182, 212, 0.35)',
        borderColor: 'rgba(6, 182, 212, 0.30)',
      },
      purple: {
        iconColor: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.06)',
        pressedBg: 'rgba(168, 85, 247, 0.18)',
        glowColor: 'rgba(168, 85, 247, 0.35)',
        borderColor: 'rgba(168, 85, 247, 0.30)',
      },
      default: {
        iconColor: 'rgba(255, 255, 255, 0.9)',
        bgColor: 'rgba(255, 255, 255, 0.04)',
        pressedBg: 'rgba(255, 255, 255, 0.12)',
        glowColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.20)',
      },
    };
    return configs[variant] || configs.default;
  }, [variant]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      whileTap={{ scale: TAP_SCALE }}
      transition={springConfig}
      style={{
        width: buttonSize,
        height: buttonSize,
        // NO FRAME: Just floating icons with subtle glow on press
        backgroundColor: 'transparent',
        border: 'none',
        // GPU acceleration
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
        // Disabled state
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
      }}
      className="flex items-center justify-center touch-manipulation select-none relative"
    >
      {/* Icon with color and subtle animation */}
      <motion.span
        animate={{
          scale: isPressed ? 0.9 : 1,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: iconSize,
          height: iconSize,
          color: variantConfig.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: isPrimary ? `drop-shadow(0 0 4px ${variantConfig.glowColor})` : 'none',
        }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});

ActionButton.displayName = 'ActionButton';

function SwipeActionButtonBarComponent({
  onLike,
  onDislike,
  onShare,
  onUndo,
  onMessage,
  canUndo = false,
  disabled = false,
  className = '',
}: SwipeActionButtonBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springConfig, delay: 0.02 }}
      className={`relative flex items-center justify-center ${className}`}
      style={{
        // Transparent container - buttons float on gradient
        padding: '8px 20px',
        // GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        // Position above gradient
        zIndex: 100,
      }}
    >
      {/* Buttons Row - Premium spacing, centered layout */}
      <div
        className="flex items-center justify-center"
        style={{ gap: BUTTON_GAP }}
      >
        {/* 1. Return/Undo Button (Small) - Amber */}
        <ActionButton
          onClick={onUndo || (() => {})}
          disabled={disabled || !canUndo}
          size="small"
          variant="amber"
          ariaLabel="Undo last swipe"
        >
          <RotateCcw className="w-full h-full" strokeWidth={2} />
        </ActionButton>

        {/* 2. Dislike Button (Large) - Red Thumbs Down */}
        <ActionButton
          onClick={onDislike}
          disabled={disabled}
          size="large"
          variant="dislike"
          ariaLabel="Pass on this listing"
        >
          <ThumbsDown className="w-full h-full" fill="currentColor" />
        </ActionButton>

        {/* 3. Share Button (Small) - Purple */}
        {onShare && (
          <ActionButton
            onClick={onShare}
            disabled={disabled}
            size="small"
            variant="purple"
            ariaLabel="Share this listing"
          >
            <Share2 className="w-full h-full" strokeWidth={2} />
          </ActionButton>
        )}

        {/* 4. Like Button (Large) - Green Heart */}
        <ActionButton
          onClick={onLike}
          disabled={disabled}
          size="large"
          variant="like"
          ariaLabel="Like this listing"
        >
          <Heart className="w-full h-full" fill="currentColor" />
        </ActionButton>

        {/* 5. Message Button (Small) - Cyan */}
        {onMessage && (
          <ActionButton
            onClick={onMessage}
            disabled={disabled}
            size="small"
            variant="cyan"
            ariaLabel="Message the owner"
          >
            <MessageCircle className="w-full h-full" strokeWidth={2} />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

export const SwipeActionButtonBar = memo(SwipeActionButtonBarComponent);
