import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";
import { pageTransition, premiumEasing, motionVariants } from "./MotionConfig";

/**
 * PageTransition - Cinematic page entrance wrapper
 *
 * Usage: Wrap page content for premium slide-up effect
 * Note: This is OPTIONAL - AppLayout already handles navigation transitions
 * Use this for special pages that need extra cinematic flair
 */
interface PageTransitionProps {
  children: ReactNode;
  variant?: "slideUp" | "fade" | "scale";
  className?: string;
  transition?: Transition;
}

export const PageTransition = ({
  children,
  variant = "slideUp",
  className = "",
  transition = pageTransition,
}: PageTransitionProps) => {
  const variants = motionVariants[variant];

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger children for cascading entrance effect
 * Great for lists, cards, or grouped content
 */
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer = ({
  children,
  staggerDelay = 0.05,
  className = "",
}: StaggerContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Individual stagger item
 */
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className = "" }: StaggerItemProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: premiumEasing,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
