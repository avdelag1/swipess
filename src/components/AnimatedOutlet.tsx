import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AnimatedOutlet
 * 
 * Replaces the standard React Router <Outlet /> to enable smooth
 * page transitions between routes.
 * 
 * How it works:
 * useOutlet() grabs the matched route element. AnimatePresence caches this
 * element during the exit phase so it doesn't instantly snap to the new route
 * content before fading out.
 */
export function AnimatedOutlet() {
    const location = useLocation();
    const element = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            {element ? (
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{
                        duration: 0.25,
                        ease: [0.22, 1, 0.36, 1] // Apple-like custom easing
                    }}
                    className="h-full w-full flex flex-col flex-1"
                >
                    {element}
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
