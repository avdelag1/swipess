import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * UNIFIED PAGE TRANSITION WRAPPER
 *
 * Wraps standalone pages (public/legal/info) with the same transition
 * used across the dashboard (matching the landing↔auth style).
 * Dashboard pages get this via AnimatedOutlet; public pages use this directly.
 */

const enterEase = [0.22, 1, 0.36, 1] as const;
const exitEase = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.12,
      ease: enterEase,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.08,
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
