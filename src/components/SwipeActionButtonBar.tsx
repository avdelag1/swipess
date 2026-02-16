/**
 * SWIPE ACTION BUTTON BAR - TINDER-LEVEL DESIGN
 *
 * Large circular buttons with heavy shadows like Tinder.
 * Bold, confident, professional.
 *
 * BUTTON ORDER (LEFT → RIGHT):
 * 1. Return/Undo (large) - white circle, amber icon
 * 2. Dislike (large) - white circle, red icon
 * 3. Like (large) - white circle, green icon
 * 4. Message (large) - white circle, blue icon
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, MessageCircle, Heart, ThumbsDown, X } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

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

// TINDER-STYLE SIZING
const BUTTON_SIZE = 68;  // Large circular buttons like Tinder
const ICON_SIZE = 30;    // Bold icons (28-32px recommended)

// Tap animation - subtle press
const TAP_SCALE = 0.92;

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
} as const;

/**
 * TINDER-STYLE ACTION BUTTON
 *
 * Solid white circle with heavy shadow.
 * Icon colored, not the button.
 * Bold and confident.
 */
const ActionButton = memo(({
  onClick,
  disabled = false,
  variant = 'default',
  children,
  ariaLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: 'like' | 'dislike' | 'undo' | 'message' | 'share';
  children: React.ReactNode;
  ariaLabel: string;
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic(variant === 'like' ? 'success' : variant === 'dislike' ? 'warning' : 'light');
    onClick();
  }, [disabled, variant, onClick]);

  // Icon colors - NOT the button, just the icon
  const iconColors: Record<string, string> = {
    like: '#22c55e',     // Green
    dislike: '#ef4444',   // Red
    undo: '#f59e0b',     // Amber
    message: '#06b6d4',  // Cyan
    share: '#a855f7',    // Purple
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={{ scale: TAP_SCALE }}
      transition={springConfig}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        // SOLID WHITE CIRCLE like Tinder
        backgroundColor: disabled ? 'rgba(255,255,255,0.3)' : '#ffffff',
        borderRadius: '50%',
        // HEAVY DROP SHADOW
        boxShadow: disabled 
          ? 'none'
          : '0 8px 32px rgba(0,0,0,0.35)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      className="touch-manipulation select-none"
    >
      <motion.span
        animate={{ scale: disabled ? 0.9 : 1 }}
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          color: disabled ? 'rgba(0,0,0,0.3)' : iconColors[variant] || '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("relative flex items-center justify-center gap-4", className)}
      style={{
        padding: '12px 24px',
        // Center the button group
        width: '100%',
      }}
    >
      {/* Buttons Row - TINDER STYLE */}
      <div className="flex items-center justify-center gap-4">
        {/* Undo Button - White circle */}
        {onUndo && (
          <ActionButton
            onClick={onUndo || (() => {})}
            disabled={disabled || !canUndo}
            variant="undo"
            ariaLabel="Undo last swipe"
          >
            <RotateCcw strokeWidth={2.5} />
          </ActionButton>
        )}

        {/* Dislike Button - White circle */}
        <ActionButton
          onClick={onDislike}
          disabled={disabled}
          variant="dislike"
          ariaLabel="Pass on this listing"
        >
          <X strokeWidth={2.5} />
        </ActionButton>

        {/* Like Button - White circle */}
        <ActionButton
          onClick={onLike}
          disabled={disabled}
          variant="like"
          ariaLabel="Like this listing"
        >
          <Heart strokeWidth={2.5} fill={disabled ? 'none' : 'currentColor'} />
        </ActionButton>

        {/* Message Button - White circle */}
        {onMessage && (
          <ActionButton
            onClick={onMessage}
            disabled={disabled}
            variant="message"
            ariaLabel="Message the owner"
          >
            <MessageCircle strokeWidth={2.5} />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

export const SwipeActionButtonBar = memo(SwipeActionButtonBarComponent);
