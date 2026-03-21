import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] } }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
                className="h-full w-full flex flex-col flex-1"
                style={{ willChange: 'opacity' }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
