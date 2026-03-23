import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * UNIFIED PAGE TRANSITION WRAPPER
 *
 * Wraps standalone pages (public/legal/info) with the same transition
 * used across the dashboard (matching the landing↔auth style).
 * Dashboard pages get this via AnimatedOutlet; public pages use this directly.
 */

const enterEase = [0.25, 0.46, 0.45, 0.94] as const;
const exitEase = [0.4, 0, 1, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: enterEase,
    }
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.97,
    transition: {
      duration: 0.16,
      ease: exitEase,
    }
  },
};

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
