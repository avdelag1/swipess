// Modern animation utilities for butter-smooth 60fps performance

import { Variants, Transition } from 'framer-motion';

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

// Page transition variants
export const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: springConfigs.smooth
  },
  exit: { 
    opacity: 0, 
    y: -15,
    scale: 0.98,
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: "easeOut" }
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

// Button press animation
export const buttonTapAnimation = {
  scale: 0.96,
  transition: { duration: 0.1 }
};

// Button hover animation
export const buttonHoverAnimation = {
  scale: 1.03,
  transition: springConfigs.snappy
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

// Scale pop variants
export const scalePopVariants: Variants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0,
    filter: 'blur(8px)'
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    filter: 'blur(0px)',
    transition: springConfigs.bouncy
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    filter: 'blur(4px)',
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

// Modal/Dialog variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 5,
    transition: { duration: 0.15 }
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