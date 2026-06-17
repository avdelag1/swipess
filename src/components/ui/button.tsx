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

/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { useCallback, useState } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

// ── CVA VARIANTS ─────────────────────────────────────────────────────────
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ' +
  'select-none touch-manipulation will-change-transform transform-gpu ' +
  'relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_20px_rgba(var(--primary),0.6)] hover:brightness-110',
        destructive: 'bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_10px_rgba(220,38,38,0.3)]',
        outline: 'border border-input bg-background/50 text-foreground opacity-90 hover:opacity-100 backdrop-blur-xl',
        secondary: 'bg-secondary/80 text-secondary-foreground opacity-95 hover:opacity-100 backdrop-blur-lg shadow-sm',
        ghost: 'hover:bg-accent/50 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline shadow-none',
        premium: 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_20px_rgba(var(--primary),0.6)] hover:brightness-110',
        tinder: 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_10px_hsl(var(--primary)/0.25)]',
        // ✅ FIX: Force text-black in light theme for glassLight variant
        glass: 'text-foreground bg-foreground/10 dark:bg-white/10 backdrop-blur-2xl border-t border-white/20 border-b-black/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
        glassStrong: 'text-foreground bg-foreground/20 dark:bg-white/15 backdrop-blur-[40px] border-t border-white/30 border-b-black/30 shadow-[0_12px_40px_rgb(0,0,0,0.2)]',
        glassLight: 'text-black dark:text-white bg-white/80 dark:bg-white/70 backdrop-blur-2xl border-t border-white/40 shadow-lg',
        gradient: 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_20px_rgba(var(--primary),0.6)] hover:brightness-110',
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
// Snappy tween taps — faster perceived response than spring wobble
const elasticTap = {
  scale: 0.94,
  transition: { type: 'tween' as const, duration: 0.07, ease: [0.2, 0, 0, 1] as const },
};

const subtleTap = {
  scale: 0.96,
  transition: { type: 'tween' as const, duration: 0.06, ease: [0.2, 0, 0, 1] as const },
};

const hoverLift = {
  scale: 1.02,
  y: -1,
  transition: { type: 'tween' as const, duration: 0.12, ease: [0.2, 0, 0, 1] as const },
};

// ── RIPPLE TYPES ─────────────────────────────────────────────────────────
interface RippleState {
  id: number;
  x: number;
  y: number;
}

// ── BUTTON PROPS ─────────────────────────────────────────────────────────
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
      return 'rgba(255,255,255,0.25)';
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

const prefersFineHover =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
        whileHover={prefersFineHover ? hoverLift : undefined}
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
