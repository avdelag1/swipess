import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PREMIUM PAGE TRANSITIONS
 * 
 * Spring physics for buttery-smooth, game-like feel:
 * - Faster, snappier transitions (no sluggish ease curves)
 * - Subtle slide + fade for depth
 * - Optimized will-change for 60fps performance
 */

// Premium spring config - feels like a high-end mobile app
const pageTransition = {
  initial: { opacity: 0, x: 8, scale: 0.98 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 400,
      damping: 32,
      mass: 0.8
    }
  },
  exit: { 
    opacity: 0, 
    x: -8,
    scale: 0.98,
    transition: { 
      type: 'spring',
      stiffness: 500,
      damping: 40,
      mass: 0.6
    }
  },
  // Performance optimizations
  style: { 
    willChange: 'transform, opacity',
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
