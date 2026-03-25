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
    y: 10,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.18,
      ease: [0.25, 0.46, 0.45, 0.94],
      opacity: { duration: 0.14 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1], // fast ease-in for snappy exit
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
