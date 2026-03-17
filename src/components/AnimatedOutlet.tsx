import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AnimatedOutlet
 * 
 * Lightweight route transition — opacity + subtle translate only.
 * Uses <Outlet /> (not useOutlet) to prevent stale route references
 * that cause navigation to appear frozen.
 */
export function AnimatedOutlet() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                        duration: 0.22,
                        ease: [0.23, 1, 0.32, 1], // Deceleration curve (Power4)
                    }
                }}
                exit={{
                    opacity: 0,
                    scale: 1.01,
                    transition: {
                        duration: 0.15,
                        ease: [0.4, 0, 1, 1],
                    }
                }}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity, transform' }}
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    );
}
