import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SIGNATURE PAGE TRANSITION — clean crossfade
 *
 * Pure opacity fade — no Y translation to avoid "sliding from bottom" feel.
 * GPU-composited: opacity only, zero layout cost.
 */

const pageTransition = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: "easeOut",
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    }
  },
} as const;

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence initial={false}>
            <motion.div
                key={location.pathname}
                {...pageTransition}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
