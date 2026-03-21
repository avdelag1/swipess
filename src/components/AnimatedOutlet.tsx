import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ANIMATED OUTLET
 *
 * Smooth fade + subtle horizontal slide — matches the landing page transition style.
 * Every top-level navigation triggers this transition.
 */
export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
                }}
                exit={{
                    opacity: 0,
                    scale: 0.97,
                    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
                }}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity, transform' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
