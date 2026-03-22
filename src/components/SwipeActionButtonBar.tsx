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
const _TAP_SPRING = { type: 'spring' as const, stiffness: 460, damping: 26, mass: 0.55 } as const;
const ICON_SPRING = { type: 'spring' as const, stiffness: 520, damping: 28 } as const;
const ENTRY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.7 } as const;

// ── DIMENSIONS ────────────────────────────────────────────────────────────────
const LARGE_CSS = 'clamp(48px, 13vw, 60px)';
const SMALL_CSS = 'clamp(36px, 10vw, 44px)';
const LARGE_ICON = 28;
const SMALL_ICON = 20;
const GAP_CSS = 'clamp(8px, 3vw, 14px)';
const TAP_SCALE = 0.87;

// ── VARIANT CONFIGS ───────────────────────────────────────────────────────────
type Variant = 'default' | 'like' | 'dislike' | 'amber' | 'cyan' | 'purple';

interface VariantCfg {
  iconColor: string;
  glow: string;
  glowIntense: string;
  dropShadow: string;
  circleBg: string;
  circleBorder: string;
}

const VARIANTS: Record<Variant, VariantCfg> = {
  like: {
    iconColor: '#ff6b35',
    glow: '0 0 20px rgba(255, 107, 53, 0.4)',
    glowIntense: '0 0 40px rgba(255, 107, 53, 0.5)',
    dropShadow: 'var(--shadow-cinematic-primary)',
    circleBg: 'rgba(255, 107, 53, 0.15)',
    circleBorder: 'none',
  },
  dislike: {
    iconColor: '#ef4444',
    glow: '0 0 20px rgba(239, 68, 68, 0.4)',
    glowIntense: '0 0 40px rgba(239, 68, 68, 0.5)',
    dropShadow: '0 12px 24px -6px rgba(239, 68, 68, 0.45)',
    circleBg: 'rgba(239, 68, 68, 0.15)',
    circleBorder: 'none',
  },
  amber: {
    iconColor: '#f59e0b',
    glow: '0 0 16px rgba(245, 158, 11, 0.35)',
    glowIntense: '0 0 32px rgba(245, 158, 11, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)',
    circleBg: 'rgba(245, 158, 11, 0.15)',
    circleBorder: 'none',
  },
  cyan: {
    iconColor: '#06b6d4',
    glow: '0 0 16px rgba(6, 182, 212, 0.35)',
    glowIntense: '0 0 32px rgba(6, 182, 212, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(6, 182, 212, 0.4)',
    circleBg: 'rgba(6, 182, 212, 0.15)',
    circleBorder: 'none',
  },
  purple: {
    iconColor: '#a855f7',
    glow: '0 0 16px rgba(168, 85, 247, 0.35)',
    glowIntense: '0 0 32px rgba(168, 85, 247, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(168, 85, 247, 0.4)',
    circleBg: 'rgba(168, 85, 247, 0.15)',
    circleBorder: 'none',
  },
  default: {
    iconColor: '#ffffff',
    glow: '0 0 14px rgba(255,255,255,0.2)',
    glowIntense: '0 0 28px rgba(255,255,255,0.3)',
    dropShadow: '0 8px 16px -4px rgba(255, 255, 255, 0.3)',
    circleBg: 'rgba(255, 255, 255, 0.15)',
    circleBorder: 'none',
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
      {/* Cinematic Shade — The atmospheric background halo */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300 pointer-events-none"
        style={{
          background: isPressed ? cfg.glowIntense : cfg.glow,
          filter: 'blur(8px)',
          transform: isPressed ? 'scale(1.15)' : 'scale(1)',
          opacity: isPressed ? 0.8 : 0.4,
        }}
      />

      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: cfg.circleBg,
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
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
          filter: `drop-shadow(${cfg.dropShadow})`,
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
          <ThumbsDown className="w-full h-full" strokeWidth={2.4} />
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
          <Flame className="w-full h-full" strokeWidth={2.4} />
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
