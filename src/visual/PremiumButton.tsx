import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { microInteraction, hoverScale, tapScale } from "./MotionConfig";

/**
 * PremiumButton - Luxury button with subtle micro-interactions
 *
 * Features:
 * - Subtle hover scale (1.02-1.03)
 * - Tap scale feedback (0.97)
 * - Glass morphism effect
 * - Soft glow on hover
 */

type ButtonVariant = "glass" | "solid" | "outline" | "ghost" | "luxury";
type ButtonSize = "sm" | "md" | "lg";

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  hoverEffect?: "subtle" | "medium" | "prominent";
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      children,
      variant = "glass",
      size = "md",
      className = "",
      hoverEffect = "subtle",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative font-medium transition-all rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles: Record<ButtonVariant, string> = {
      glass:
        "bg-white/10 backdrop-blur-lg border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl",
      solid:
        "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl",
      outline:
        "border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5",
      ghost: "hover:bg-white/5",
      luxury:
        "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-2xl hover:shadow-purple-500/50",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    const scaleValue =
      hoverEffect === "prominent"
        ? hoverScale.prominent
        : hoverEffect === "medium"
        ? hoverScale.medium
        : hoverScale.subtle;

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: scaleValue }}
        whileTap={{ scale: tapScale }}
        transition={microInteraction}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

/**
 * IconButton - Premium icon-only button
 */
interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  children: ReactNode;
  size?: ButtonSize;
  className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, size = "md", className = "", ...props }, ref) => {
    const sizeStyles: Record<ButtonSize, string> = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: hoverScale.medium }}
        whileTap={{ scale: tapScale }}
        transition={microInteraction}
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "bg-white/10 backdrop-blur-lg border border-white/10",
          "hover:border-white/20 shadow-lg hover:shadow-xl",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";

/**
 * FloatingActionButton - Premium FAB with glow effect
 */
interface FABProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
}

export const FloatingActionButton = forwardRef<HTMLButtonElement, FABProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: hoverScale.medium, y: -2 }}
        whileTap={{ scale: tapScale }}
        transition={microInteraction}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary to-primary/90",
          "text-primary-foreground shadow-2xl hover:shadow-primary/50",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

FloatingActionButton.displayName = "FloatingActionButton";
