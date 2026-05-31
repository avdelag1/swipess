import { useLocation, useOutlet } from 'react-router-dom';
import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  const isDashboardRoute =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/');

  if (isDashboardRoute) {
    return (
      <div
        className="min-h-full w-full flex flex-col flex-1 bg-transparent"
        style={{ position: 'relative', pointerEvents: 'none' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full flex flex-col bg-transparent pointer-events-none-force"
            style={{ position: 'absolute', inset: 0 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
              </div>
            }>
              {outlet}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        id="page-scroll-container"
        className="w-full min-h-full block bg-background"
        style={{ position: 'relative', pointerEvents: 'auto' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.10, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        }>
          {outlet}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
