import { Variants } from 'framer-motion';

/**
 * Premium, butter-smooth Framer Motion fade & scale variants.
 * Inspired by high-end iOS spring transitions.
 */
export const deckFadeVariants: Variants = {
  initial: {
    opacity: 0,
    y: 15,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1], // easeOutQuint
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
