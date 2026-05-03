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
import { Share2, Undo2, MessageCircle, Flame, ThumbsDown, Eye, Info } from 'lucide-react';
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
const _TAP_SPRING = { type: 'spring' as const, stiffness: 460, damping: 26, mass: 0.55 } as const;
const _ICON_SPRING = { type: 'spring' as const, stiffness: 520, damping: 28 } as const;
const ENTRY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.7 } as const;

// ── DIMENSIONS ────────────────────────────────────────────────────────────────
const LARGE_CSS = 'clamp(44px, 11vw, 54px)';
const SMALL_CSS = 'clamp(38px, 9vw, 44px)';
const LARGE_ICON = 26;
const SMALL_ICON = 18;
const GAP_CSS = 'clamp(6px, 1.5vw, 12px)';
const TAP_SCALE = 0.92;

// ── VARIANT CONFIGS ───────────────────────────────────────────────────────────
type Variant = 'default' | 'like' | 'dislike' | 'amber' | 'blue' | 'purple' | 'gold' | 'green';

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
    iconColor: '#FF5722', // Deep Orange / Fire
    glow: '0 0 24px rgba(255, 87, 34, 0.45)',
    glowIntense: '0 0 45px rgba(255, 87, 34, 0.6)',
    dropShadow: 'var(--shadow-cinematic-primary)',
    circleBg: 'rgba(255, 87, 34, 0.35)',
    circleBorder: '1px solid rgba(255, 255, 255, 0.4)',
  },
  dislike: {
    iconColor: '#EF4444', // Red
    glow: '0 0 20px rgba(239, 68, 68, 0.4)',
    glowIntense: '0 0 40px rgba(239, 68, 68, 0.5)',
    dropShadow: '0 12px 24px -6px rgba(239, 68, 68, 0.45)',
    circleBg: 'rgba(239, 68, 68, 0.35)',
    circleBorder: '1px solid rgba(255, 255, 255, 0.4)',
  },
  amber: {
    iconColor: '#f59e0b',
    glow: '0 0 16px rgba(245, 158, 11, 0.35)',
    glowIntense: '0 0 32px rgba(245, 158, 11, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)',
    circleBg: 'rgba(245, 158, 11, 0.35)',
    circleBorder: '1px solid rgba(255, 255, 255, 0.4)',
  },
  green: {
    iconColor: '#22C55E', // Vivid Green
    glow: '0 0 16px rgba(34, 197, 94, 0.35)',
    glowIntense: '0 0 32px rgba(34, 197, 94, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(34, 197, 94, 0.4)',
    circleBg: 'rgba(34, 197, 94, 0.35)',
    circleBorder: '1px solid rgba(255, 255, 255, 0.4)',
  },
  blue: {
    iconColor: '#3B82F6', // Vivid Blue
    glow: '0 0 16px rgba(59, 130, 246, 0.35)',
    glowIntense: '0 0 32px rgba(59, 130, 246, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
    circleBg: 'rgba(59, 130, 246, 0.35)',
    circleBorder: '1px solid rgba(255, 255, 255, 0.4)',
  },
  pink: {
    iconColor: '#EB4898', // Nexus Neon Pink
    glow: '0 0 16px rgba(235, 72, 152, 0.35)',
    glowIntense: '0 0 32px rgba(235, 72, 152, 0.45)',
    dropShadow: '0 8px 16px -4px rgba(235, 72, 152, 0.4)',
    circleBg: 'rgba(235, 72, 152, 0.35)',
    circleBorder: '1px solid rgba(255, 255, 255, 0.4)',
  },
  gold: {
    iconColor: '#FFD700',
    glow: '0 0 20px rgba(255, 215, 0, 0.4)',
    glowIntense: '0 0 40px rgba(255, 215, 0, 0.6)',
    dropShadow: '0 12px 24px -6px rgba(255, 215, 0, 0.45)',
    circleBg: 'rgba(255, 215, 0, 0.25)', 
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

// ── ACTION BUTTON ─────────────────────────────────────────────────────────────
const ActionButton = memo(({
  onClick,
  disabled = false,
  size = 'small',
  variant = 'default',
  children,
  ariaLabel,
  index = 0,
  isLight = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'large';
  variant?: Variant;
  children: React.ReactNode;
  ariaLabel: string;
  index?: number;
  isLight?: boolean;
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
        y: 3,
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
      {/* 🚀 ATMOSPHERIC DEPTH: Multi-layered cinematic shadows — theme-aware */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300 pointer-events-none"
        style={{
          background: isPressed ? 'transparent' : cfg.glow,
          boxShadow: isPressed 
            ? 'none' 
            : isLight
              ? `0 8px 20px -6px ${cfg.iconColor}55, 0 4px 8px -4px ${cfg.iconColor}33`
              : `0 12px 24px -10px ${cfg.iconColor}66, 0 4px 6px -4px ${cfg.iconColor}44`,
          filter: 'blur(10px)',
          transform: isPressed ? 'scale(0.9)' : 'scale(1)',
          opacity: isPressed ? 0 : (isLight ? 0.55 : 0.45),
        }}
      />

      {/* 🚀 TACTILE MATERIAL: Convex -> Concave — theme-aware surfaces */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: isPressed 
            ? `radial-gradient(circle at center, ${cfg.iconColor}33 0%, transparent 100%)`
            : isLight
              ? `linear-gradient(145deg, ${cfg.iconColor}18 0%, ${cfg.iconColor}08 100%)`
              : `linear-gradient(145deg, ${cfg.iconColor}22 0%, ${cfg.iconColor}05 100%)`,
          boxShadow: isPressed
            ? isLight
              ? `inset 0 4px 10px rgba(0,0,0,0.15), inset 0 -4px 10px rgba(255,255,255,0.3)`
              : `inset 0 4px 10px rgba(0,0,0,0.5), inset 0 -4px 10px rgba(255,255,255,0.05)`
            : isLight
              ? `0 6px 14px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.7)`
              : `0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)`,
          border: isLight ? `1px solid ${cfg.iconColor}30` : '1px solid rgba(255,255,255,0.05)',
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
export const SwipeActionButtonBar = memo(({
  onLike,
  onDislike,
  onShare,
  onInsights,
  onUndo,
  onMessage,
  canUndo = false,
  disabled = false,
  className = '',
}: SwipeActionButtonBarProps) => {
  const { isLight } = useAppTheme();

  return (
    <div
      className={`flex items-center gap-6 pointer-events-auto overflow-visible ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {/* Undo Button (Green) */}
        {onUndo && (
          <ActionButton
            onClick={onUndo}
            disabled={disabled || !canUndo}
            size="small"
            variant="green"
            ariaLabel="Undo"
            index={0}
            isLight={isLight}
          >
            <Undo2 className="w-full h-full" strokeWidth={2.5} />
          </ActionButton>
        )}

        {/* Dislike Button (Red / ThumbsDown) */}
        <ActionButton
          onClick={onDislike}
          disabled={disabled}
          size="large"
          variant="dislike"
          ariaLabel="Dislike"
          index={1}
          isLight={isLight}
        >
          <ThumbsDown className="w-full h-full" strokeWidth={2.5} />
        </ActionButton>

        {/* Message/Connect Button (Blue) */}
        {onMessage && (
          <ActionButton
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

        {/* Like Button (Orange / Flame) */}
        <ActionButton
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

        {/* Insights/Eye Button */}
        {onInsights && (
          <ActionButton
            onClick={onInsights}
            disabled={disabled}
            size="small"
            variant="blue"
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
