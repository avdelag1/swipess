/**
 * BUTTON — 2026 Liquid Glass Design
 *
 * Enhanced reusable button with:
 *   • Liquid ripple on every press (expands from tap point like water)
 *   • Liquid Glass visual variants (glass, glassStrong)
 *   • Subtle hover lift + spring tap compression
 *   • Haptic feedback
 *   • Full a11y (focus rings, reduced-motion, disabled states)
 *   • GPU-accelerated, 60fps on all devices
 *
 * RIPPLE MECHANISM:
 *   On every click, we record the pointer coordinates relative to the button,
 *   spawn a <span> at that position, then animate it from scale(0) → scale(4)
 *   with opacity 0.45 → 0 using a CSS keyframe (`liquid-ripple`).
 *   Using CSS rather than Framer Motion for the ripple keeps it off the
 *   JS animation loop entirely, preserving swipe card performance.
 */

import * as React from 'react';
import { useState, useCallback, useRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

// ── CVA VARIANTS ──────────────────────────────────────────────────────────────
const buttonVariants = cva(
  // Base: always applied — layout, text, focus, GPU acc., touch optimisation
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ' +
  'select-none touch-manipulation will-change-transform transform-gpu ' +
  'relative overflow-hidden',   // ← overflow-hidden + relative needed for ripple
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 border-b-2 border-primary/80',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg rounded-3xl border-b-2 border-destructive/80',
        outline:
          'border-2 border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-3xl shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 rounded-3xl border-b-2 border-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground rounded-2xl',
        link: 'text-primary underline-offset-4 hover:underline',
        premium:
          'bg-gradient-premium text-white shadow-premium premium-glow hover:shadow-glow rounded-3xl border-b-2 border-purple-800',
        tinder:
          'bg-background text-foreground hover:bg-accent shadow-xl rounded-3xl border border-border',
        /**
         * LIQUID GLASS variants — 2026 flagship buttons
         *
         * 'glass': medium-strength liquid glass. Works on dark backgrounds.
         *   Shows the blurred content behind it through the frosted surface.
         *
         * 'glassStrong': heavier frosting + brighter rim. Use for CTAs.
         */
        glass:
          // Semi-transparent base + strong backdrop blur + bright rim
          'text-white border border-white/20 ' +
          'bg-white/8 backdrop-blur-2xl ' +
          // Inner top rim highlight (the glass edge catch-light)
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_4px_16px_rgba(0,0,0,0.25)]',
        glassStrong:
          'text-white border border-white/28 ' +
          'bg-white/12 backdrop-blur-[32px] ' +
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.30),0_8px_24px_rgba(0,0,0,0.30)]',
        glassLight:
          // For light / white-matte themes
          'text-foreground border border-border ' +
          'bg-card/75 backdrop-blur-2xl ' +
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.90),0_2px_8px_rgba(0,0,0,0.08)]',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 rounded-xl px-4',
        lg: 'h-14 rounded-2xl px-8 text-base',
        icon: 'h-12 w-12 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// ── SPRING ANIMATION CONFIGS ──────────────────────────────────────────────────
// Elastic (wobbly) — for CTAs and primary actions
const elasticTap = {
  scale: 0.92,
  transition: { type: 'spring' as const, stiffness: 500, damping: 12, mass: 0.6 },
};

// Subtle — for secondary / utility buttons
const subtleTap = {
  scale: 0.96,
  transition: { type: 'spring' as const, stiffness: 600, damping: 20, mass: 0.4 },
};

// Hover lift — desktop only, adds energy to glass buttons
const hoverLift = {
  scale: 1.03,
  y: -1,
  transition: { type: 'spring' as const, stiffness: 400, damping: 18, mass: 0.5 },
};

// ── RIPPLE TYPES ──────────────────────────────────────────────────────────────
interface RippleState {
  id: number;
  x: number;
  y: number;
}

// ── BUTTON PROPS ──────────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Use elastic wobbly spring on press (great for CTAs) */
  elastic?: boolean;
  /** Disable the liquid ripple (use for icon buttons in tight layouts) */
  noRipple?: boolean;
}

// Determine ripple colour based on variant
function getRippleColor(variant: string | null | undefined): string {
  switch (variant) {
    case 'glass':
    case 'glassStrong':
      return 'rgba(255,255,255,0.30)';
    case 'glassLight':
      return 'rgba(0,0,0,0.08)';
    case 'destructive':
      return 'rgba(255,100,100,0.35)';
    case 'premium':
      return 'rgba(255,255,255,0.25)';
    default:
      return 'rgba(255,255,255,0.28)';
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      elastic = false,
      noRipple = false,
      onClick,
      ...props
    },
    ref,
  ) => {
    // ── Ripple state ──────────────────────────────────────────────────────
    // We track an array so multiple rapid taps each get their own ripple.
    const [ripples, setRipples] = useState<RippleState[]>([]);
    const rippleColor = getRippleColor(variant);

    const spawnRipple = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (noRipple) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now() + Math.random();
        setRipples((prev) => [...prev, { id, x, y }]);
        // Remove after animation completes (600ms)
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 650);
      },
      [noRipple],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        triggerHaptic('light');
        spawnRipple(e);
        onClick?.(e);
      },
      [onClick, spawnRipple],
    );

    // ── asChild passthrough (e.g. wrapping a Link) ─────────────────────────
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            triggerHaptic('light');
            onClick?.(e);
          }}
          {...props}
        />
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={elastic ? elasticTap : subtleTap}
        whileHover={hoverLift}
        onClick={handleClick}
        {...(props as any)}
      >
        {/* Liquid ripple elements — CSS animated for max performance */}
        {ripples.map(({ id, x, y }) => (
          <span
            key={id}
            aria-hidden="true"
            className="liquid-ripple"
            style={{
              left: x,
              top: y,
              background: rippleColor,
            }}
          />
        ))}

        {/* Liquid Glass shimmer highlight — only for glass variants */}
        {(variant === 'glass' || variant === 'glassStrong' || variant === 'glassLight') && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 liquid-glass-highlight--animated"
            style={{
              borderRadius: 'inherit',
              // Primary catch-light at top-left, secondary at bottom-right
              background: `
                radial-gradient(ellipse 140% 55% at 20% 0%,
                  rgba(255,255,255,${variant === 'glassLight' ? 0.55 : 0.18}) 0%, transparent 65%),
                radial-gradient(ellipse 70% 40% at 90% 110%,
                  rgba(255,255,255,${variant === 'glassLight' ? 0.22 : 0.07}) 0%, transparent 58%)
              `,
              backgroundSize: '220% 220%, 100% 100%',
              zIndex: 0,
            }}
          />
        )}

        {/* Actual button content — sits above all FX */}
        <span className="relative z-10 inline-flex items-center gap-2">{props.children}</span>
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
