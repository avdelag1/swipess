/**
 * Premium Animation Presets for AAA-game-level UX
 * 
 * Use these spring configs for buttery-smooth, snappy micro-interactions
 * that feel like high-end mobile apps and games.
 */

import { Variants } from 'framer-motion';

// ============================================
// SPRING CONFIGS - Premium feel
// ============================================

/** Snappy, responsive spring - ideal for buttons */
export const springSnappy = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.7
};

/** Smooth, elegant spring - ideal for cards and lists */
export const springSmooth = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8
};

/** Quick tap response - ideal for taps/clicks */
export const springTap = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 20,
  mass: 0.5
};

// ============================================
// MICRO-ANIMATION VARIANTS
// ============================================

/** Button press effect - scale down slightly on tap */
export const buttonTapVariants: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: springSnappy 
  },
  tap: { 
    scale: 0.97,
    transition: springTap 
  }
};

/** Card hover effect - subtle lift and shadow */
export const cardHoverVariants: Variants = {
  rest: { 
    y: 0, 
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)' 
  },
  hover: { 
    y: -2,
    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
    transition: springSmooth 
  }
};

/** List item stagger - for animated lists */
export const listItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10 
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springSmooth,
      delay: i * 0.05 // Stagger delay
    }
  })
};

/** Fade in with slight upward motion */
export const fadeInUpVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 8 
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springSmooth,
      delay: i * 0.08
    }
  })
};

/** Scale in with bounce */
export const scaleInVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      ...springSnappy,
      delay: i * 0.05
    }
  })
};

/** Slide in from right (for modals/dialogs) */
export const slideInRightVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSmooth
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15 }
  }
};

/** Slide in from bottom (for bottom sheets) */
export const slideInBottomVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth
  },
  exit: {
    opacity: 0,
    y: 40,
    transition: { duration: 0.2 }
  }
};

/** Skeleton shimmer effect */
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// ============================================
// HOOKS
// ============================================

/**
 * Stagger delay calculator for lists
 * Use: items.map((_, i) => staggerDelay(i, 0.05))
 */
export const staggerDelay = (index: number, baseDelay: number = 0.05): number => {
  return index * baseDelay;
};

