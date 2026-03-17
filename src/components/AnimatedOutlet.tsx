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
        <AnimatePresence mode="sync" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                    transition: {
                        duration: 0.15,
                        ease: 'easeOut',
                    }
                }}
                exit={{
                    opacity: 0,
                    transition: {
                        duration: 0.08,
                    }
                }}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity' }}
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    );
}
