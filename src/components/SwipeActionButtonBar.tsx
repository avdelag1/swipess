/**
 * SWIPE ACTION BUTTON BAR — 2026 Liquid Glass Design
 *
 * Floating button bar for swipe cards with full Liquid Glass treatment.
 *
 * UPGRADE FROM PREVIOUS VERSION:
 *   - Each button now has a double-layer Liquid Glass surface:
 *       Layer 1: backdrop-filter blur (heavy — 28px) + semi-transparent fill
 *       Layer 2: animated radial highlight that drifts across the button face,
 *                simulating light refracting through curved water/glass
 *   - Press feedback is richer: spring scale compression + ripple wave
 *   - The container bar itself gets a liquid glass "tray" background
 *   - Staggered entry animation (buttons appear in a left-to-right wave)
 *
 * BUTTON ORDER (LEFT → RIGHT):
 *   1. Return/Undo  (small) — amber
 *   2. Dislike      (large) — red
 *   3. Share        (small) — purple
 *   4. Like         (large) — orange/fire
 *   5. Message      (small) — cyan
 */

import { memo, useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, RotateCcw, MessageCircle, Flame, ThumbsDown } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';

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

// Button tap spring — tight, snappy, premium
const TAP_SPRING = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 26,
  mass: 0.55,
} as const;

// Icon scale spring (for the inner icon on press)
const ICON_SPRING = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 28,
} as const;

// Container entry spring
const ENTRY_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 26,
  mass: 0.7,
} as const;

// ── BUTTON DIMENSIONS ─────────────────────────────────────────────────────────
// Responsive sizing via CSS clamp — scales between narrow (360px) and wide (430px+) devices
const LARGE_CSS = 'clamp(52px, 15vw, 64px)';
const SMALL_CSS = 'clamp(40px, 11vw, 48px)';
const LARGE = 64;   // fallback for JS calculations
const SMALL = 48;
const LARGE_ICON = 30;
const SMALL_ICON = 22;
const GAP_CSS = 'clamp(6px, 2.5vw, 10px)';
const TAP_SCALE = 0.87;

// ── VARIANT CONFIGS ───────────────────────────────────────────────────────────
// Each variant defines its colour palette. The glass uses the colour as a tint
// rather than an opaque fill — so content behind shows through.
type Variant = 'default' | 'like' | 'dislike' | 'amber' | 'cyan' | 'purple';

interface VariantCfg {
  iconColor: string;
  // Base glass fill — very low alpha so the blur dominates
  glassBg: string;
  glassBgLight: string;
  // Pressed state — slightly higher alpha
  pressedBg: string;
  // Border colour — the coloured rim defines the button identity
  border: string;
  // Glow for the drop-shadow on icon
  glow: string;
  // The moving liquid highlight tint colour
  highlightTint: string;
}

const VARIANTS: Record<Variant, VariantCfg> = {
  like: {
    iconColor: '#ff6b35',
    glassBg: 'rgba(255, 107, 53, 0.14)',
    glassBgLight: 'rgba(255, 107, 53, 0.12)',
    pressedBg: 'rgba(255, 107, 53, 0.32)',
    border: 'rgba(255, 107, 53, 0.80)',
    glow: 'rgba(255, 107, 53, 0.55)',
    highlightTint: 'rgba(255, 150, 80, 0.22)',
  },
  dislike: {
    iconColor: '#ef4444',
    glassBg: 'rgba(239, 68, 68, 0.14)',
    glassBgLight: 'rgba(239, 68, 68, 0.11)',
    pressedBg: 'rgba(239, 68, 68, 0.30)',
    border: 'rgba(239, 68, 68, 0.80)',
    glow: 'rgba(239, 68, 68, 0.50)',
    highlightTint: 'rgba(255, 100, 100, 0.20)',
  },
  amber: {
    iconColor: '#f59e0b',
    glassBg: 'rgba(245, 158, 11, 0.14)',
    glassBgLight: 'rgba(245, 158, 11, 0.11)',
    pressedBg: 'rgba(245, 158, 11, 0.28)',
    border: 'rgba(245, 158, 11, 0.75)',
    glow: 'rgba(245, 158, 11, 0.45)',
    highlightTint: 'rgba(255, 190, 50, 0.20)',
  },
  cyan: {
    iconColor: '#06b6d4',
    glassBg: 'rgba(6, 182, 212, 0.14)',
    glassBgLight: 'rgba(6, 182, 212, 0.10)',
    pressedBg: 'rgba(6, 182, 212, 0.26)',
    border: 'rgba(6, 182, 212, 0.75)',
    glow: 'rgba(6, 182, 212, 0.45)',
    highlightTint: 'rgba(50, 210, 240, 0.18)',
  },
  purple: {
    iconColor: '#a855f7',
    glassBg: 'rgba(168, 85, 247, 0.14)',
    glassBgLight: 'rgba(168, 85, 247, 0.10)',
    pressedBg: 'rgba(168, 85, 247, 0.26)',
    border: 'rgba(168, 85, 247, 0.75)',
    glow: 'rgba(168, 85, 247, 0.45)',
    highlightTint: 'rgba(190, 120, 255, 0.18)',
  },
  default: {
    iconColor: '#1a1a1a',
    glassBg: 'rgba(255,255,255,0.85)',
    glassBgLight: 'rgba(255,255,255,0.90)',
    pressedBg: 'rgba(240,240,240,0.92)',
    border: 'rgba(0,0,0,0.12)',
    glow: 'rgba(0,0,0,0.10)',
    highlightTint: 'rgba(255,255,255,0.60)',
  },
};

// ── RIPPLE STATE ──────────────────────────────────────────────────────────────
interface Ripple { id: number; x: number; y: number }

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
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';

  const cfg = VARIANTS[variant];
  const btnSizeCss = size === 'large' ? LARGE_CSS : SMALL_CSS;
  const btnSize = size === 'large' ? LARGE : SMALL;
  const iconSize = size === 'large' ? LARGE_ICON : SMALL_ICON;
  const isPrimary = size === 'large';

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();

    // Haptic — stronger for like/dislike (primary actions)
    if (variant === 'like')    triggerHaptic('success');
    else if (variant === 'dislike') triggerHaptic('warning');
    else                            triggerHaptic('light');

    // Spawn liquid ripple from tap centre
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 650);

    onClick();
  }, [disabled, variant, onClick]);

  // ── Glass surface style ──────────────────────────────────────────────────
  const bg = isPressed
    ? cfg.pressedBg
    : (isLight ? cfg.glassBgLight : cfg.glassBg);

  const boxShadow = isLight
    ? (isPressed
      ? 'inset 0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)'
      : `inset 0 1px 0 rgba(255,255,255,0.85), 0 ${isPrimary ? 6 : 4}px ${isPrimary ? 16 : 10}px rgba(0,0,0,0.10)`)
    : (isPressed
      ? `inset 0 2px 6px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.20)`
      : `inset 0 1px 0 rgba(255,255,255,0.18), 0 ${isPrimary ? 10 : 6}px ${isPrimary ? 24 : 14}px rgba(0,0,0,0.38), 0 2px 4px rgba(0,0,0,0.22)`);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      // Staggered entry: each button arrives 50ms after the previous
      initial={{ opacity: 0, y: 12, scale: 0.88 }}
      animate={{ opacity: 1,  y: 0,  scale: 1 }}
      transition={{ ...ENTRY_SPRING, delay: index * 0.05 }}
      whileTap={{ scale: TAP_SCALE }}
      style={{
        width: btnSizeCss,
        height: btnSizeCss,
        // LAYER 1: Liquid glass base
        backgroundColor: bg,
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        // LAYER 2: Coloured glass rim (defines button identity)
        border: `1px solid ${cfg.border}`,
        borderRadius: '50%',
        boxShadow,
        // GPU acceleration
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        // overflow hidden so ripple stays inside the circle
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
      className="flex items-center justify-center touch-manipulation select-none"
    >
      {/* LAYER 3: Animated liquid highlight — the key 2026 effect
          A radial gradient that drifts slowly across the button surface,
          simulating light refracting through a curved glass / water droplet.
          The highlight uses the button's own tint colour for colour-matched feel. */}
      <span
        aria-hidden="true"
        className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse 150% 65% at 25% 8%,
              rgba(255,255,255,${isLight ? 0.65 : 0.22}) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 85% 95%,
              ${cfg.highlightTint} 0%, transparent 55%)
          `,
          backgroundSize: '220% 220%, 100% 100%',
          zIndex: 1,
        }}
      />

      {/* Liquid ripple on press */}
      <AnimatePresence>
        {ripples.map(({ id, x, y }) => (
          <motion.span
            key={id}
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0.45 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0, 0.55, 0.45, 1] }}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 36,
              height: 36,
              marginLeft: -18,
              marginTop: -18,
              borderRadius: '50%',
              background: `rgba(255,255,255,0.32)`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Icon — spring-scales on press for a satisfying crunch */}
      <motion.span
        animate={{ scale: isPressed ? 0.88 : 1 }}
        transition={ICON_SPRING}
        style={{
          width: iconSize,
          height: iconSize,
          color: cfg.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: `drop-shadow(0 0 ${isPrimary ? 6 : 4}px ${cfg.glow})`,
          position: 'relative',
          zIndex: 3,
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
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1,  y: 0,  scale: 1 }}
      transition={{ ...ENTRY_SPRING, delay: 0.05 }}
      className={`relative flex items-center justify-center ${className}`}
      style={{
        padding: '10px 20px',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        zIndex: 100,
      }}
    >
      {/* ── Glass tray behind the buttons ────────────────────────────────
          A very subtle liquid glass bar that the buttons sit on top of.
          It gives the button cluster a cohesive, floating feel. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '4px 8px',
          borderRadius: 48,
          backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(12px) saturate(140%)',
          WebkitBackdropFilter: 'blur(12px) saturate(140%)',
          border: `1px solid ${isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.10)'}`,
          boxShadow: isLight
            ? 'inset 0 1px 0 rgba(255,255,255,0.90), 0 2px 8px rgba(0,0,0,0.06)'
            : 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 16px rgba(0,0,0,0.30)',
          zIndex: 0,
        }}
      />

      {/* Buttons row */}
      <div
        className="relative flex items-center justify-center"
        style={{ gap: GAP_CSS, zIndex: 1 }}
      >
        {/* 1. Undo (small) — amber */}
        <ActionButton
          onClick={onUndo || (() => {})}
          disabled={disabled || !canUndo}
          size="small"
          variant="amber"
          ariaLabel="Undo last swipe"
          index={0}
        >
          <RotateCcw className="w-full h-full" strokeWidth={2.2} />
        </ActionButton>

        {/* 2. Dislike (large) — red */}
        <ActionButton
          onClick={onDislike}
          disabled={disabled}
          size="large"
          variant="dislike"
          ariaLabel="Pass on this listing"
          index={1}
        >
          <ThumbsDown className="w-full h-full" fill="currentColor" />
        </ActionButton>

        {/* 3. Share (small) — purple */}
        {onShare && (
          <ActionButton
            onClick={onShare}
            disabled={disabled}
            size="small"
            variant="purple"
            ariaLabel="Share this listing"
            index={2}
          >
            <Share2 className="w-full h-full" strokeWidth={2.2} />
          </ActionButton>
        )}

        {/* 4. Like (large) — orange */}
        <ActionButton
          onClick={onLike}
          disabled={disabled}
          size="large"
          variant="like"
          ariaLabel="Like this listing"
          index={3}
        >
          <Flame className="w-full h-full" fill="currentColor" />
        </ActionButton>

        {/* 5. Message (small) — cyan */}
        {onMessage && (
          <ActionButton
            onClick={onMessage}
            disabled={disabled}
            size="small"
            variant="cyan"
            ariaLabel="Message the owner"
            index={4}
          >
            <MessageCircle className="w-full h-full" strokeWidth={2.2} />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

export const SwipeActionButtonBar = memo(SwipeActionButtonBarComponent);
