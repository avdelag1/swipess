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
const enterEase = [0.25, 0.46, 0.45, 0.94] as const;
const exitEase = [0.4, 0, 1, 1] as const;

const pageTransition = {
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
  style: {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden' as const
  }
};

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
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
