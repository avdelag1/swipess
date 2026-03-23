import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * TINDER-SPEED PAGE WRAPPER
 *
 * For standalone pages (public/legal/info). Matches the ultra-fast
 * opacity-only transitions used in AnimatedOutlet.
 */

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.08,
      ease: "easeOut",
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.06,
      ease: "easeIn",
    }
  },
} as const;

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      style={{ willChange: 'opacity' }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
