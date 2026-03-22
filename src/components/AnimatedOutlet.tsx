import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ 
                    opacity: 1, 
                    scale: 1,
                    transition: { 
                        duration: 0.16, 
                        ease: [0.23, 1, 0.32, 1] // Snappy ease-out
                    } 
                }}
                exit={{ 
                    opacity: 0, 
                    scale: 1.01,
                    transition: { 
                        duration: 0.08, 
                        ease: [0.4, 0, 1, 1] 
                    } 
                }}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity, transform' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
