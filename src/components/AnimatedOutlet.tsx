import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UNIFIED PAGE TRANSITIONS
 *
 * Matches the premium landing↔auth transition style across the entire app:
 * - Smooth vertical slide + fade (not horizontal spring)
 * - Subtle scale for depth
 * - Fast, elegant easing curves
 * - Optimized will-change for 60fps performance
 */

// Easing curves matching the landing/auth transition
const enterEase = [0.22, 1, 0.36, 1] as const;
const exitEase = [0.22, 1, 0.36, 1] as const;

const pageTransition = {
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
  style: {
    willChange: 'opacity',
    backfaceVisibility: 'hidden' as const
  }
};

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={location.pathname}
                {...pageTransition}
                className="h-full w-full flex flex-col flex-1"
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
