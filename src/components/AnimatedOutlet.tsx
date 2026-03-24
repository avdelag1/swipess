import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SIGNATURE PAGE TRANSITION — slide-up + fade
 *
 * One unified motion for every page in the app:
 * - Incoming page glides up 14px while fading in (260ms ease-out-quart)
 * - Outgoing page fades out quickly (140ms easeIn) — crossfade, no wait
 * - GPU-composited: opacity + transform only, zero layout cost
 */

const EASE_OUT_QUART = [0.25, 0.46, 0.45, 0.94] as const;

const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: EASE_OUT_QUART,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.14,
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
                style={{ willChange: 'opacity, transform' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
