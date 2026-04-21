// Modern animation utilities for butter-smooth 60fps performance

import { Variants } from 'framer-motion';

// Spring configurations for different use cases
export const springConfigs = {
  smooth: { type: "spring" as const, stiffness: 400, damping: 40, mass: 0.8 },
  snappy: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.6 },
  bouncy: { type: "spring" as const, stiffness: 350, damping: 20, mass: 1 },
  gentle: { type: "spring" as const, stiffness: 300, damping: 45, mass: 1 },
  quick: { type: "spring" as const, stiffness: 600, damping: 35, mass: 0.5 },
  wobbly: { type: "spring" as const, stiffness: 200, damping: 15, mass: 1.2 },
};

// Easing curves for different effects
export const easings = {
  smooth: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
};

// Page transition variants — blur REMOVED (GPU-expensive, causes jank on mobile)
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08, ease: "easeOut" }
  },
};

// Card entrance animations
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: springConfigs.smooth
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15, ease: "easeOut" }
  }
};

// Swipe card exit animations - optimized for all screen sizes
export const swipeExitVariants = {
  left: {
    x: -500,
    rotate: -25,
    opacity: 0,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] }
  },
  right: {
    x: 500,
    rotate: 25,
    opacity: 0,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] }
  },
};

// Button press animation — classic subtle
export const buttonTapAnimation = {
  scale: 0.96,
  transition: { duration: 0.1 }
};

// Elastic "jelly" press — wobbly spring rebound on tap
export const elasticTapAnimation = {
  scale: 0.92,
  transition: { type: "spring" as const, stiffness: 500, damping: 12, mass: 0.6 }
};

// Woven/rubber-band press — deeper squish with overshoot
export const wovenTapAnimation = {
  scale: 0.88,
  transition: { type: "spring" as const, stiffness: 350, damping: 10, mass: 0.8 }
};

// Button hover animation
export const buttonHoverAnimation = {
  scale: 1.03,
  transition: springConfigs.snappy
};

// Elastic hover — subtle float-up with spring
export const elasticHoverAnimation = {
  scale: 1.05,
  y: -2,
  transition: { type: "spring" as const, stiffness: 400, damping: 15, mass: 0.5 }
};

// Overlay fade variants
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    }
  }
};

// Stagger item variants
export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: springConfigs.snappy
  }
};

// Shake animation for errors
export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 }
};

// Particle burst animation
export const particleBurstVariants: Variants = {
  hidden: { scale: 0, opacity: 1 },
  visible: { 
    scale: [0, 1.5, 2],
    opacity: [1, 0.5, 0],
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// Modern slide-in from bottom
export const slideUpVariants: Variants = {
  hidden: { 
    y: 100, 
    opacity: 0 
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: springConfigs.smooth
  }
};

// Slide from right
export const slideRightVariants: Variants = {
  hidden: { 
    x: 100, 
    opacity: 0 
  },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: springConfigs.smooth
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Scale pop variants — no blur (blur animations are GPU-expensive and cause jank)
export const scalePopVariants: Variants = {
  hidden: {
    scale: 0.82,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springConfigs.bouncy
  },
  exit: {
    scale: 0.92,
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

// CSS transform optimization
export const gpuAcceleration = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
  WebkitBackfaceVisibility: 'hidden' as const,
  willChange: 'transform',
};

// Generate ripple effect
export const createRipple = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.classList.add('ripple');

  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
};

// Notification entrance animation
export const notificationVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: -50, 
    scale: 0.9,
    x: '-50%'
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    x: '-50%',
    transition: springConfigs.bouncy
  },
  exit: { 
    opacity: 0, 
    y: -30, 
    scale: 0.95,
    x: '-50%',
    transition: { duration: 0.2 }
  }
};

// Modal/Dialog variants — fast open, instant close
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.08 }
  }
};

// Backdrop variants
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 }
  }
};

// Deck fade variants for swipe states and skeletons
export const deckFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' as const } },
  exit:    { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' as const } },
};


