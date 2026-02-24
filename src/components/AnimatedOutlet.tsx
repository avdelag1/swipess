import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AnimatedOutlet
 * 
 * Replaces the standard React Router <Outlet /> to enable smooth
 * page transitions between routes.
 * 
 * Fixed: Uses React.cloneElement with location.key to freeze the React Router 
 * context during the exit animation, preventing unmount crashes.
 */
export function AnimatedOutlet() {
    const location = useLocation();
    const element = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            {element ? (
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 20, filter: 'blur(8px)', scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, x: -20, filter: 'blur(8px)', scale: 0.98 }}
                    transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                        mass: 0.8
                    }}
                    className="h-full w-full flex flex-col flex-1"
                >
                    {React.cloneElement(element, { key: location.pathname })}
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
