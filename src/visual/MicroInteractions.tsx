import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { microInteraction, hoverScale, tapScale, premiumEasing } from "./MotionConfig";

/**
 * Enhanced Micro-Interactions
 * Subtle animations that add premium feel
 */

/**
 * PressableArea - Generic pressable wrapper with haptic-style feedback
 */
interface PressableAreaProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  scaleEffect?: "subtle" | "medium" | "prominent";
}

export const PressableArea = forwardRef<HTMLDivElement, PressableAreaProps>(
  ({ children, onPress, className = "", scaleEffect = "subtle", ...props }, ref) => {
    const scale =
      scaleEffect === "prominent"
        ? hoverScale.prominent
        : scaleEffect === "medium"
        ? hoverScale.medium
        : hoverScale.subtle;

    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: tapScale }}
        transition={microInteraction}
        onClick={onPress}
        className={cn(onPress && "cursor-pointer", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PressableArea.displayName = "PressableArea";

/**
 * ScaleOnHover - Subtle scale effect for any element
 */
interface ScaleOnHoverProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export const ScaleOnHover = forwardRef<HTMLDivElement, ScaleOnHoverProps>(
  ({ children, className = "", scale = hoverScale.medium, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        transition={microInteraction}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

ScaleOnHover.displayName = "ScaleOnHover";

/**
 * FadeIn - Smooth fade-in animation
 */
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, className = "", delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay, ease: premiumEasing }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeIn.displayName = "FadeIn";

/**
 * SlideIn - Slide-in animation from direction
 */
type Direction = "left" | "right" | "up" | "down";

interface SlideInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  direction?: Direction;
  className?: string;
  delay?: number;
  distance?: number;
}

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  (
    { children, direction = "up", className = "", delay = 0, distance = 24, ...props },
    ref
  ) => {
    const getInitialPosition = () => {
      switch (direction) {
        case "left":
          return { x: -distance, y: 0 };
        case "right":
          return { x: distance, y: 0 };
        case "up":
          return { x: 0, y: distance };
        case "down":
          return { x: 0, y: -distance };
        default:
          return { x: 0, y: distance };
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...getInitialPosition() }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.45, delay, ease: premiumEasing }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

SlideIn.displayName = "SlideIn";

/**
 * PulseGlow - Subtle pulsing glow effect for attention
 */
interface PulseGlowProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}

export const PulseGlow = forwardRef<HTMLDivElement, PulseGlowProps>(
  ({ children, className = "", glowColor = "primary", intensity = "low", ...props }, ref) => {
    const getOpacityRange = () => {
      switch (intensity) {
        case "low":
          return [0.1, 0.2, 0.1];
        case "medium":
          return [0.2, 0.4, 0.2];
        case "high":
          return [0.3, 0.6, 0.3];
        default:
          return [0.1, 0.2, 0.1];
      }
    };

    return (
      <div className="relative">
        <motion.div
          ref={ref}
          className={cn(
            "absolute inset-0 rounded-full blur-lg -z-10",
            glowColor === "primary" && "bg-primary",
            glowColor === "purple" && "bg-purple-500",
            glowColor === "blue" && "bg-blue-500",
            glowColor === "green" && "bg-green-500",
            glowColor === "red" && "bg-red-500"
          )}
          animate={{ opacity: getOpacityRange() }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          {...props}
        />
        <div className={className}>{children}</div>
      </div>
    );
  }
);

PulseGlow.displayName = "PulseGlow";

/**
 * FloatEffect - Gentle floating animation
 */
interface FloatEffectProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
}

export const FloatEffect = forwardRef<HTMLDivElement, FloatEffectProps>(
  ({ children, className = "", distance = 8, duration = 4, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        animate={{
          y: [0, -distance, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FloatEffect.displayName = "FloatEffect";

/**
 * ShimmerEffect - Subtle shimmer/shine effect
 */
interface ShimmerEffectProps {
  children: ReactNode;
  className?: string;
}

export const ShimmerEffect = ({ children, className = "" }: ShimmerEffectProps) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1,
        }}
      />
    </div>
  );
};
