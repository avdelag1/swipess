import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SIGNATURE PAGE TRANSITION — iOS-style micro-slide + fade
 *
 * Enter: fade in + gentle lift from +10px below (feels like a card surfacing)
 * Exit: fade out + subtle scale-down (graceful dismiss)
 * GPU-composited: opacity + transform only, zero layout cost.
 */

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22, // Tightened from 0.28
      ease: [0.17, 0.17, 0.41, 1.0], // Snappy but smooth
      opacity: { duration: 0.18 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    transition: {
      duration: 0.14, // Tightened from 0.16
      ease: [0.4, 0, 1, 1], 
    },
  },
} as const;

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full w-full flex flex-col flex-1"
        style={{ willChange: 'transform, opacity' }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
