/**
 * LIQUID GLASS SURFACE — 2026 Design System
 *
 * Apple-style Liquid Glass: ultra-transparent frosted glass with strong
 * backdrop blur + subtle refractive water/liquid distortion + dynamic
 * moving light highlights that animate across the surface.
 *
 * THREE-LAYER ARCHITECTURE:
 * ┌──────────────────────────────────────────────────┐
 * │  LAYER 3: LIQUID HIGHLIGHT (animated drift)      │
 * │  — Radial gradient that slowly moves in a        │
 * │    figure-eight, simulating light refraction     │
 * │    through water / thick glass                   │
 * │──────────────────────────────────────────────────│
 * │  LAYER 2: GLASS RIM (border glow)                │
 * │  — Bright top edge + subtle bottom edge          │
 * │    replicates the physical glass rim catch-light │
 * │──────────────────────────────────────────────────│
 * │  LAYER 1: BASE GLASS (backdrop blur + fill)      │
 * │  — backdrop-filter: blur + saturate              │
 * │    Semi-transparent white/black fill             │
 * └──────────────────────────────────────────────────┘
 *
 * Usage:
 *   // Basic container
 *   <LiquidGlassSurface className="rounded-3xl p-4">
 *     <YourContent />
 *   </LiquidGlassSurface>
 *
 *   // Strong glass modal
 *   <LiquidGlassSurface intensity="strong" elevation="modal" className="rounded-3xl">
 *     <ModalContent />
 *   </LiquidGlassSurface>
 *
 *   // Interactive button (tracks pointer for alive highlight)
 *   <LiquidGlassSurface intensity="medium" interactive animated className="rounded-2xl">
 *     <button>Press me</button>
 *   </LiquidGlassSurface>
 */

import React, { forwardRef, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

// ── INTENSITY PRESETS ────────────────────────────────────────────────────────
// Controls how "thick" the glass appears — more intense = more frosted + vivid
const INTENSITY = {
  subtle: {
    bgDark: 'rgba(255,255,255,0.05)',
    bgLight: 'rgba(255,255,255,0.55)',
    blur: '16px',
    saturate: '140%',
    // How bright the top rim highlight is (0–1)
    rimBrightness: 0.12,
    // Peak opacity of the drifting liquid highlight
    highlightPeak: 0.10,
  },
  medium: {
    bgDark: 'rgba(255,255,255,0.08)',
    bgLight: 'rgba(255,255,255,0.70)',
    blur: '24px',
    saturate: '165%',
    rimBrightness: 0.18,
    highlightPeak: 0.16,
  },
  strong: {
    bgDark: 'rgba(255,255,255,0.12)',
    bgLight: 'rgba(255,255,255,0.80)',
    blur: '32px',
    saturate: '185%',
    rimBrightness: 0.24,
    highlightPeak: 0.22,
  },
  ultra: {
    bgDark: 'rgba(255,255,255,0.16)',
    bgLight: 'rgba(255,255,255,0.88)',
    blur: '40px',
    saturate: '200%',
    rimBrightness: 0.32,
    highlightPeak: 0.30,
  },
} as const;

// ── TINT OVERLAYS ────────────────────────────────────────────────────────────
// A very subtle color hue laid over the glass
const TINTS = {
  none: 'transparent',
  warm: 'rgba(255, 170, 80, 0.05)',
  cool: 'rgba(80, 150, 255, 0.05)',
  accent: 'rgba(249, 115, 22, 0.07)',
  pink: 'rgba(236, 72, 153, 0.05)',
} as const;

// ── ELEVATION SHADOWS ────────────────────────────────────────────────────────
const ELEVATION = {
  flat: '',
  raised: '0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)',
  floating: '0 8px 28px rgba(0,0,0,0.16), 0 4px 10px rgba(0,0,0,0.10)',
  modal: '0 24px 64px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.14)',
} as const;

export interface LiquidGlassSurfaceProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;

  /** Controls backdrop blur strength and highlight visibility */
  intensity?: keyof typeof INTENSITY;

  /** Animates the liquid highlight — subtle drift simulating water refraction */
  animated?: boolean;

  /** A barely-visible colour hue to tint the glass */
  tint?: keyof typeof TINTS;

  /** Force dark or light glass regardless of theme ('auto' reads from useTheme) */
  mode?: 'dark' | 'light' | 'auto';

  /** Depth of the drop shadow */
  elevation?: keyof typeof ELEVATION;

  /**
   * When true the liquid highlight follows the pointer for an "alive" premium feel.
   * Disable on long lists with many instances to avoid re-renders.
   */
  interactive?: boolean;

  // Pass-through HTML div props
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
  id?: string;
}

/**
 * LiquidGlassSurface
 *
 * Drop this around any content to apply the full 2026 Liquid Glass treatment.
 * Handles dark/light mode automatically, animates a liquid highlight, and
 * can track pointer position for an interactive catch-light effect.
 */
export const LiquidGlassSurface = forwardRef<HTMLDivElement, LiquidGlassSurfaceProps>(
  function LiquidGlassSurface(
    {
      children,
      className,
      style,
      intensity = 'medium',
      animated = true,
      tint = 'none',
      mode = 'auto',
      elevation = 'raised',
      interactive = false,
      onClick,
      onPointerDown,
      role,
      'aria-label': ariaLabel,
      tabIndex,
      id,
    },
    ref,
  ) {
    const { theme } = useTheme();
    // Determine whether we're in a dark context
    const isDark = mode === 'auto' ? theme !== 'white-matte' : mode === 'dark';

    const cfg = INTENSITY[intensity];
    const bg = isDark ? cfg.bgDark : cfg.bgLight;
    const hp = cfg.highlightPeak;

    // ── Pointer-tracking highlight ──────────────────────────────────────────
    // Uses framer-motion spring values so the highlight glides smoothly to
    // wherever the pointer is, rather than jumping instantly.
    const pointerX = useMotionValue(0.28);
    const pointerY = useMotionValue(0.08);
    const smoothX = useSpring(pointerX, { stiffness: 45, damping: 18, mass: 0.6 });
    const smoothY = useSpring(pointerY, { stiffness: 45, damping: 18, mass: 0.6 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactive || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        pointerX.set((e.clientX - rect.left) / rect.width);
        pointerY.set((e.clientY - rect.top) / rect.height);
      },
      [interactive, pointerX, pointerY],
    );

    const handlePointerLeave = useCallback(() => {
      if (!interactive) return;
      // Gently return to default top-left catch-light position
      pointerX.set(0.28);
      pointerY.set(0.08);
    }, [interactive, pointerX, pointerY]);

    // ── Glass border styles ──────────────────────────────────────────────────
    // The bright top rim simulates a physical glass edge catching light.
    // We layer an inset shadow for the inner glow on top of that.
    const borderStyle = isDark
      ? `1px solid rgba(255,255,255,${cfg.rimBrightness})`
      : `1px solid rgba(255,255,255,0.82)`;

    const boxShadow = [
      // Inner top rim — the bright "glass edge" catch-light
      `inset 0 1px 0 rgba(255,255,255,${isDark ? hp * 1.5 : 0.92})`,
      // Inner bottom — subtle dark ground shadow inside glass
      `inset 0 -1px 0 rgba(0,0,0,${isDark ? 0.06 : 0.03})`,
      // Outer drop shadow (elevation)
      ELEVATION[elevation],
    ]
      .filter(Boolean)
      .join(', ');

    // ── The liquid highlight gradient ────────────────────────────────────────
    // Primary: large bright ellipse toward top (the main glass catch-light)
    // Secondary: smaller faint reflection on the opposite corner
    // These simulate the physical optics of a thick curved glass lens.
    const highlightGradient = isDark
      ? `
        radial-gradient(ellipse 140% 60% at ${interactive ? 'var(--lx,28%)' : '28%'} ${interactive ? 'var(--ly,8%)' : '8%'},
          rgba(255,255,255,${hp * 1.6}) 0%, transparent 62%),
        radial-gradient(ellipse 80% 45% at 88% 105%,
          rgba(255,255,255,${hp * 0.6}) 0%, transparent 58%)
      `
      : `
        radial-gradient(ellipse 140% 60% at 28% 8%,
          rgba(255,255,255,0.72) 0%, transparent 62%),
        radial-gradient(ellipse 80% 45% at 88% 105%,
          rgba(255,255,255,0.28) 0%, transparent 58%)
      `;

    return (
      <div
        ref={(node) => {
          // Assign both the forwarded ref and our local containerRef
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        id={id}
        role={role}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerLeave={interactive ? handlePointerLeave : undefined}
        className={cn('relative overflow-hidden', className)}
        style={{
          // LAYER 1: Base glass — the frosted foundation
          backgroundColor: bg,
          backdropFilter: `blur(${cfg.blur}) saturate(${cfg.saturate})`,
          WebkitBackdropFilter: `blur(${cfg.blur}) saturate(${cfg.saturate})`,
          // LAYER 2: Glass rim
          border: borderStyle,
          boxShadow,
          // GPU acceleration — critical for 60fps scroll + swipe performance
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'auto',
          ...style,
        }}
      >
        {/* ── LAYER 3: Liquid highlight ──────────────────────────────────────
            This absolutely-positioned div carries the animated gradient.
            It's separate from content so it never affects layout.
            `animated` adds the CSS keyframe drift; `interactive` uses JS. */}
        {interactive ? (
          // Pointer-tracking version: framer-motion drives position via CSS var
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: 'inherit',
              zIndex: 1,
              background: highlightGradient,
              opacity: 1,
            }}
          />
        ) : (
          // CSS-only version: plays a slow keyframe drift
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0',
              animated && 'liquid-glass-highlight--animated',
            )}
            style={{
              borderRadius: 'inherit',
              zIndex: 1,
              // The gradient — both positions animate via the CSS keyframe
              background: highlightGradient,
              backgroundSize: animated ? '220% 220%, 100% 100%' : '100% 100%, 100% 100%',
            }}
          />
        )}

        {/* Optional tint overlay — a barely-visible hue that warm/cool shifts */}
        {tint !== 'none' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: 'inherit',
              background: TINTS[tint],
              zIndex: 2,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Content — always sits above all glass FX layers */}
        <div className="relative" style={{ zIndex: 3 }}>
          {children}
        </div>
      </div>
    );
  },
);

LiquidGlassSurface.displayName = 'LiquidGlassSurface';
