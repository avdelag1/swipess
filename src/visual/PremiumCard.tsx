import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { microInteraction, hoverScale } from "./MotionConfig";

/**
 * PremiumCard - Luxury card component with depth and motion
 *
 * Features:
 * - Glass morphism effect
 * - Floating hover animation
 * - Soft shadow system
 * - Cinematic depth
 */

type CardVariant = "glass" | "elevated" | "flat" | "luxury";
type CardSize = "sm" | "md" | "lg" | "full";

interface PremiumCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      children,
      variant = "glass",
      size = "md",
      className = "",
      hoverEffect = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles = "relative overflow-hidden transition-all";

    const variantStyles: Record<CardVariant, string> = {
      glass: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
      elevated: "bg-card shadow-2xl border border-border/50",
      flat: "bg-card/50 border border-border/30",
      luxury:
        "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
    };

    const sizeStyles: Record<CardSize, string> = {
      sm: "rounded-2xl p-4",
      md: "rounded-3xl p-6",
      lg: "rounded-3xl p-8",
      full: "rounded-3xl p-6 w-full",
    };

    const hoverAnimation = hoverEffect
      ? {
          whileHover: { y: -4, scale: hoverScale.medium },
          transition: { duration: 0.3 },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        {...hoverAnimation}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

/**
 * SwipeCard - Enhanced card for swipe interactions
 * Integrates with existing swipe system
 */
interface SwipeCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export const SwipeCard = forwardRef<HTMLDivElement, SwipeCardProps>(
  ({ children, className = "", onSwipeRight, onSwipeLeft, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100 && onSwipeRight) {
            onSwipeRight();
          } else if (info.offset.x < -100 && onSwipeLeft) {
            onSwipeLeft();
          }
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={microInteraction}
        className={cn(
          "relative overflow-hidden cursor-grab active:cursor-grabbing",
          "rounded-3xl bg-white/5 backdrop-blur-xl",
          "border border-white/10 shadow-2xl",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";

/**
 * FeatureCard - Premium card for showcasing features/highlights
 */
interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export const FeatureCard = ({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) => {
  return (
    <PremiumCard variant="luxury" size="md" className={className}>
      {icon && (
        <motion.div
          className="mb-4 text-primary"
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={microInteraction}
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </PremiumCard>
  );
};

/**
 * GlowCard - Card with animated glow effect for premium CTAs
 */
interface GlowCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  glowColor?: string;
  className?: string;
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ children, glowColor = "primary", className = "", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: hoverScale.medium }}
        transition={microInteraction}
        className={cn("relative rounded-3xl p-6", className)}
        {...props}
      >
        {/* Animated glow effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-3xl blur-xl -z-10",
            glowColor === "primary" && "bg-primary/20",
            glowColor === "purple" && "bg-purple-500/20",
            glowColor === "blue" && "bg-blue-500/20"
          )}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Card content */}
        <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlowCard.displayName = "GlowCard";
