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
      {/* No mode="wait" — that holds the old screen on-screen for the full exit
          duration before painting the new one, which makes navigation feel
          laggy. Default cross-fade lets the new page paint immediately while
          the old one fades out. Filter/scale removed to keep it cheap. */}
      <AnimatePresence>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 w-full flex flex-col"
          style={{ position: 'absolute', inset: 0 }}
        >
          <Suspense fallback={<SuspenseFallback minimal />}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
