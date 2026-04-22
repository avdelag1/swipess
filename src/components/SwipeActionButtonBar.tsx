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
import { motion } from 'framer-motion';
import { Share2, RotateCcw, MessageCircle, Flame, ThumbsDown, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { AnimatedLottieIcon } from './ui/AnimatedLottieIcon';

interface SwipeActionButtonBarProps {
  onLike: () => void;
  onDislike: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onMessage?: () => void;
  onSpeedMeet?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
}

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────
const _TAP_SPRING = { type: 'spring' as const, stiffness: 460, damping: 26, mass: 0.55 } as const;
const _ICON_SPRING = { type: 'spring' as const, stiffness: 520, damping: 28 } as const;
const ENTRY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.7 } as const;

// ── DIMENSIONS ────────────────────────────────────────────────────────────────
const LARGE_CSS = 'clamp(46px, 13vw, 56px)';
const SMALL_CSS = 'clamp(34px, 10vw, 42px)';
const LARGE_ICON = 26;
const SMALL_ICON = 19;
const GAP_CSS = 'clamp(8px, 3.5vw, 16px)';
const TAP_SCALE = 0.94;

// ── VARIANT CONFIGS ───────────────────────────────────────────────────────────
type Variant = 'default' | 'like' | 'dislike' | 'amber' | 'cyan' | 'purple' | 'gold';

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
  gold: {
    iconColor: '#FFD700',
    glow: '0 0 20px rgba(255, 215, 0, 0.4)',
    glowIntense: '0 0 40px rgba(255, 215, 0, 0.6)',
    dropShadow: '0 12px 24px -6px rgba(255, 215, 0, 0.45)',
    circleBg: 'rgba(255, 215, 0, 0.15)',
    circleBorder: 'none',
  },
  default: {
    iconColor: 'currentColor',
    glow: '0 0 14px rgba(255,255,255,0.1)',
    glowIntense: '0 0 28px rgba(255,255,255,0.2)',
    dropShadow: 'var(--shadow-cinematic-sm)',
    circleBg: 'var(--secondary)',
    circleBorder: '1px solid var(--border)',
  },
};

// ── GLOW BURST ────────────────────────────────────────────────────────────────
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
      whileTap={{ 
        scale: TAP_SCALE,
        y: 3, // 🚀 PHYSICAL DEPRESS: Simulates button travel distance
        transition: { type: 'spring', stiffness: 600, damping: 15 }
      }}
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
        color: variant === 'default' ? 'var(--foreground)' : cfg.iconColor
      }}
      className="flex items-center justify-center touch-manipulation select-none"
    >
      {/* 🚀 ATMOSPHERIC DEPTH: Multi-layered cinematic shadows */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300 pointer-events-none"
        style={{
          background: isPressed ? 'transparent' : cfg.glow,
          boxShadow: isPressed 
            ? 'none' 
            : `0 12px 24px -10px ${cfg.iconColor}66, 0 4px 6px -4px ${cfg.iconColor}44`,
          filter: 'blur(10px)',
          transform: isPressed ? 'scale(0.9)' : 'scale(1)',
          opacity: isPressed ? 0 : 0.45,
        }}
      />

      {/* 🚀 TACTILE MATERIAL: Convex -> Concave Morph */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none border border-white/5"
        style={{
          background: isPressed 
            ? `radial-gradient(circle at center, ${cfg.iconColor}33 0%, transparent 100%)` // Concave (Inward)
            : `linear-gradient(145deg, ${cfg.iconColor}22 0%, ${cfg.iconColor}05 100%)`, // Convex (Outward)
          boxShadow: isPressed
            ? `inset 0 4px 10px rgba(0,0,0,0.5), inset 0 -4px 10px rgba(255,255,255,0.05)` // Depressed
            : `0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)`, // Raised
          transform: isPressed ? 'scale(0.96)' : 'scale(1)',
          transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
        }}
      />
      
      {/* Icon with deep colored drop-shadow */}
      <div 
        className="relative z-10 transition-transform duration-200"
        style={{ transform: isPressed ? 'scale(0.92) translateY(1px)' : 'scale(1)' }}
      >
        <AnimatedLottieIcon
          iconId={variant === 'like' ? 'heart' : variant === 'dislike' ? 'dislike' : variant}
          active={isPressed}
          size={iconSize}
          className="relative z-10"
          inactiveIcon={children}
        />
      </div>
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
  onSpeedMeet,
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
          <RotateCcw className="w-full h-full" strokeWidth={1.5} />
        </ActionButton>

        <ActionButton
          onClick={onDislike}
          disabled={disabled}
          size="large"
          variant="dislike"
          ariaLabel="Pass on this listing"
          index={1}
        >
          <ThumbsDown className="w-full h-full" strokeWidth={1.8} />
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
            <Share2 className="w-full h-full" strokeWidth={1.5} />
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
          <Flame className="w-full h-full" strokeWidth={1.8} />
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
            <MessageCircle className="w-full h-full" strokeWidth={1.5} />
          </ActionButton>
        )}

        {onSpeedMeet && (
          <ActionButton
            onClick={onSpeedMeet}
            disabled={disabled}
            size="large"
            variant="gold"
            ariaLabel="AI Speed Meet"
            index={5}
          >
            <Sparkles className="w-full h-full" strokeWidth={1.8} />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

export const SwipeActionButtonBar = memo(SwipeActionButtonBarComponent);


