import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuspenseFallback } from './ui/suspense-fallback';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  return (
    <div
      className="min-h-full w-full flex flex-col flex-1"
      style={{ position: 'relative' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.99, y: 4 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
          exit={{ opacity: 0, filter: 'blur(8px)', scale: 1.01, y: -4 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.25 }
          }}
          className="flex-1 w-full flex flex-col"
        >
          <Suspense fallback={<SuspenseFallback minimal />}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


