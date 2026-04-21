import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

/**
 * PremiumButton — Upgraded luxury button with liquid ripple + haptics
 *
 * Features:
 *   • Liquid ripple on press (CSS-animated, GPU-accelerated)
 *   • Haptic feedback on tap
 *   • Elastic spring tap compression
 *   • Solid glass backgrounds (no backdrop-blur — GPU savings)
 *   • Subtle hover lift
 */

type ButtonVariant = "glass" | "solid" | "outline" | "ghost" | "luxury";
type ButtonSize = "sm" | "md" | "lg";

// ── Spring configs ────────────────────────────────────────────────────────────
const elasticTap = {
  scale: 0.92,
  transition: { type: 'spring' as const, stiffness: 500, damping: 12, mass: 0.6 },
};

const subtleTap = {
  scale: 0.96,
  transition: { type: 'spring' as const, stiffness: 600, damping: 20, mass: 0.4 },
};

const hoverLift = {
  scale: 1.03,
  y: -1,
  transition: { type: 'spring' as const, stiffness: 400, damping: 18, mass: 0.5 },
};

// ── Ripple ────────────────────────────────────────────────────────────────────
interface RippleState { id: number; x: number; y: number; }

function useRipple() {
  const [ripples, setRipples] = useState<RippleState[]>([]);

  const spawn = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 650);
  }, []);

  return { ripples, spawn };
}

// ── PremiumButton ─────────────────────────────────────────────────────────────
interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Use elastic wobbly spring (great for CTAs) */
  elastic?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ children, variant = "glass", size = "md", className = "", elastic = false, onClick, ...props }, ref) => {
    const { ripples, spawn } = useRipple();

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic('light');
      spawn(e);
      (onClick as any)?.(e);
    }, [onClick, spawn]);

    const baseStyles =
      "relative font-medium rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden select-none touch-manipulation will-change-transform transform-gpu";

    const variantStyles: Record<ButtonVariant, string> = {
      glass:
        "bg-[#1a1a1a]/80 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)] text-white",
      solid:
        "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl",
      outline:
        "border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-foreground",
      ghost:
        "hover:bg-white/5 text-foreground",
      luxury:
        "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-2xl hover:shadow-purple-500/50",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={hoverLift}
        whileTap={elastic ? elasticTap : subtleTap}
        onClick={handleClick}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {/* Liquid ripples */}
        {ripples.map(({ id, x, y }) => (
          <span
            key={id}
            aria-hidden="true"
            className="liquid-ripple"
            style={{ left: x, top: y, background: 'rgba(255,255,255,0.25)' }}
          />
        ))}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

// ── IconButton ────────────────────────────────────────────────────────────────
interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  children: ReactNode;
  size?: ButtonSize;
  className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, size = "md", className = "", onClick, ...props }, ref) => {
    const { ripples, spawn } = useRipple();

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic('light');
      spawn(e);
      (onClick as any)?.(e);
    }, [onClick, spawn]);

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={hoverLift}
        whileTap={subtleTap}
        onClick={handleClick}
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden",
          "bg-[#1a1a1a]/80 border border-white/12",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.3)]",
          "select-none touch-manipulation will-change-transform transform-gpu",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {ripples.map(({ id, x, y }) => (
          <span
            key={id}
            aria-hidden="true"
            className="liquid-ripple"
            style={{ left: x, top: y, background: 'rgba(255,255,255,0.30)' }}
          />
        ))}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";

// ── FloatingActionButton ──────────────────────────────────────────────────────
interface FABProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
}

export const FloatingActionButton = forwardRef<HTMLButtonElement, FABProps>(
  ({ children, className = "", onClick, ...props }, ref) => {
    const { ripples, spawn } = useRipple();

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic('medium');
      spawn(e);
      (onClick as any)?.(e);
    }, [onClick, spawn]);

    return (
      <motion.button
        ref={ref}
        whileHover={{ ...hoverLift, y: -3 }}
        whileTap={elasticTap}
        onClick={handleClick}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full overflow-hidden",
          "bg-gradient-to-br from-primary to-primary/90",
          "text-primary-foreground shadow-2xl hover:shadow-primary/50",
          "select-none touch-manipulation will-change-transform transform-gpu",
          className
        )}
        {...props}
      >
        {ripples.map(({ id, x, y }) => (
          <span
            key={id}
            aria-hidden="true"
            className="liquid-ripple"
            style={{ left: x, top: y, background: 'rgba(255,255,255,0.35)' }}
          />
        ))}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

FloatingActionButton.displayName = "FloatingActionButton";

