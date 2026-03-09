/**
 * SWIPE ACTION BUTTON BAR — Phantom Icon Design
 *
 * Frameless, backgroundless floating icons with expressive shadows and glow.
 * Zero backdrop-filter blur layers for maximum PWA performance.
 *
 * BUTTON ORDER (LEFT → RIGHT):
 *   1. Return/Undo  (small) — amber
 *   2. Dislike      (large) — red
 *   3. Share        (small) — purple
 *   4. Like         (large) — orange/fire
 *   5. Message      (small) — cyan
 */

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, RotateCcw, MessageCircle, Flame, ThumbsDown } from 'lucide-react';
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

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────
const TAP_SPRING = { type: 'spring' as const, stiffness: 460, damping: 26, mass: 0.55 } as const;
const ICON_SPRING = { type: 'spring' as const, stiffness: 520, damping: 28 } as const;
const ENTRY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.7 } as const;

// ── DIMENSIONS ────────────────────────────────────────────────────────────────
const LARGE_CSS = 'clamp(52px, 15vw, 64px)';
const SMALL_CSS = 'clamp(40px, 11vw, 48px)';
const LARGE_ICON = 34;
const SMALL_ICON = 24;
const GAP_CSS = 'clamp(8px, 3vw, 14px)';
const TAP_SCALE = 0.87;

// ── VARIANT CONFIGS ───────────────────────────────────────────────────────────
type Variant = 'default' | 'like' | 'dislike' | 'amber' | 'cyan' | 'purple';

interface VariantCfg {
  iconColor: string;
  glow: string;
  glowIntense: string;
}

const VARIANTS: Record<Variant, VariantCfg> = {
  like: {
    iconColor: '#ff6b35',
    glow: '0 4px 20px rgba(255, 107, 53, 0.45), 0 0 8px rgba(255, 107, 53, 0.25)',
    glowIntense: '0 0 28px rgba(255, 107, 53, 0.6), 0 0 56px rgba(255, 107, 53, 0.3)',
  },
  dislike: {
    iconColor: '#ef4444',
    glow: '0 4px 20px rgba(239, 68, 68, 0.45), 0 0 8px rgba(239, 68, 68, 0.25)',
    glowIntense: '0 0 28px rgba(239, 68, 68, 0.6), 0 0 56px rgba(239, 68, 68, 0.3)',
  },
  amber: {
    iconColor: '#f59e0b',
    glow: '0 4px 16px rgba(245, 158, 11, 0.40), 0 0 6px rgba(245, 158, 11, 0.20)',
    glowIntense: '0 0 24px rgba(245, 158, 11, 0.55), 0 0 48px rgba(245, 158, 11, 0.25)',
  },
  cyan: {
    iconColor: '#06b6d4',
    glow: '0 4px 16px rgba(6, 182, 212, 0.40), 0 0 6px rgba(6, 182, 212, 0.20)',
    glowIntense: '0 0 24px rgba(6, 182, 212, 0.55), 0 0 48px rgba(6, 182, 212, 0.25)',
  },
  purple: {
    iconColor: '#a855f7',
    glow: '0 4px 16px rgba(168, 85, 247, 0.40), 0 0 6px rgba(168, 85, 247, 0.20)',
    glowIntense: '0 0 24px rgba(168, 85, 247, 0.55), 0 0 48px rgba(168, 85, 247, 0.25)',
  },
  default: {
    iconColor: '#ffffff',
    glow: '0 4px 12px rgba(255,255,255,0.15)',
    glowIntense: '0 0 20px rgba(255,255,255,0.3)',
  },
};

// ── GLOW BURST ────────────────────────────────────────────────────────────────
interface GlowBurst { id: number }

// ── ACTION BUTTON ─────────────────────────────────────────────────────────────
const ActionButton = memo(({
  onClick,
  disabled = false,
  size = 'small',
  variant = 'default',
  children,
  ariaLabel,
  index = 0,
}: {
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'large';
  variant?: Variant;
  children: React.ReactNode;
  ariaLabel: string;
  index?: number;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [glowBursts, setGlowBursts] = useState<GlowBurst[]>([]);

  const cfg = VARIANTS[variant];
  const btnSizeCss = size === 'large' ? LARGE_CSS : SMALL_CSS;
  const iconSize = size === 'large' ? LARGE_ICON : SMALL_ICON;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();

    if (variant === 'like') triggerHaptic('success');
    else if (variant === 'dislike') triggerHaptic('warning');
    else triggerHaptic('light');

    // Spawn glow burst
    const id = Date.now() + Math.random();
    setGlowBursts(prev => [...prev, { id }]);
    setTimeout(() => setGlowBursts(prev => prev.filter(b => b.id !== id)), 450);

    onClick();
  }, [disabled, variant, onClick]);

  return (
    <motion.button
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
      whileTap={{ scale: TAP_SCALE }}
      style={{
        width: btnSizeCss,
        height: btnSizeCss,
        // NO background, NO border, NO blur — pure phantom icon
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '50%',
        transform: 'translateZ(0)',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        overflow: 'visible',
        position: 'relative',
        flexShrink: 0,
      }}
      className="flex items-center justify-center touch-manipulation select-none"
    >
      {/* Glow burst on tap — radial light bloom */}
      <AnimatePresence>
        {glowBursts.map(({ id }) => (
          <motion.span
            key={id}
            aria-hidden="true"
            initial={{ scale: 0.3, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0, 0.55, 0.45, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${cfg.iconColor}44 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Icon with deep colored drop-shadow */}
      <motion.span
        animate={{ scale: isPressed ? 0.85 : 1 }}
        transition={ICON_SPRING}
        style={{
          width: iconSize,
          height: iconSize,
          color: cfg.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: `drop-shadow(${cfg.glow.split(',')[0].replace(/^0/, '0')})`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});

ActionButton.displayName = 'ActionButton';

// ── BUTTON BAR ────────────────────────────────────────────────────────────────
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
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...ENTRY_SPRING, delay: 0.05 }}
      className={`relative flex items-center justify-center ${className}`}
      style={{
        padding: '10px 20px',
        transform: 'translateZ(0)',
        zIndex: 100,
      }}
    >
      {/* No glass tray — clean frameless layout */}
      <div
        className="relative flex items-center justify-center"
        style={{ gap: GAP_CSS }}
      >
        <ActionButton
          onClick={onUndo || (() => {})}
          disabled={disabled || !canUndo}
          size="small"
          variant="amber"
          ariaLabel="Undo last swipe"
          index={0}
        >
          <RotateCcw className="w-full h-full" strokeWidth={2.8} />
        </ActionButton>

        <ActionButton
          onClick={onDislike}
          disabled={disabled}
          size="large"
          variant="dislike"
          ariaLabel="Pass on this listing"
          index={1}
        >
          <ThumbsDown className="w-full h-full" fill="currentColor" strokeWidth={0} />
        </ActionButton>

        {onShare && (
          <ActionButton
            onClick={onShare}
            disabled={disabled}
            size="small"
            variant="purple"
            ariaLabel="Share this listing"
            index={2}
          >
            <Share2 className="w-full h-full" strokeWidth={2.8} />
          </ActionButton>
        )}

        <ActionButton
          onClick={onLike}
          disabled={disabled}
          size="large"
          variant="like"
          ariaLabel="Like this listing"
          index={3}
        >
          <Flame className="w-full h-full" fill="currentColor" strokeWidth={0} />
        </ActionButton>

        {onMessage && (
          <ActionButton
            onClick={onMessage}
            disabled={disabled}
            size="small"
            variant="cyan"
            ariaLabel="Message the owner"
            index={4}
          >
            <MessageCircle className="w-full h-full" strokeWidth={2.8} />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

export const SwipeActionButtonBar = memo(SwipeActionButtonBarComponent);
