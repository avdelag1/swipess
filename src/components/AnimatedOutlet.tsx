import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  // On the persistent dashboard routes the outlet is empty by design
  // (the dashboard is rendered by PersistentDashboardScene below). We
  // make the outlet wrapper fully transparent so that layer shows
  // through; on every other route we keep `bg-background` so the page
  // fully covers the dashboard underneath.
  const isDashboardRoute =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/');

  // Dashboard routes: use the original absolute overlay so the persistent
  // swipe deck below stays interactive. Use AnimatePresence for the
  // cross-fade between dashboard and the empty placeholder.
  // Sub-route content must set pointer-events: auto if it needs interaction.
  if (isDashboardRoute) {
    return (
      <div
        className="min-h-full w-full flex flex-col flex-1 bg-transparent pointer-events-none-force"
        style={{ position: 'relative' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.10, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full flex flex-col bg-transparent"
            style={{ position: 'absolute', inset: 0, pointerEvents: outlet ? 'auto' : 'none' }}
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

  // Non-dashboard routes: AnimatedOutlet is INTENTIONALLY not a scroll
  // container — #dashboard-scroll-container (in DashboardLayout) is the
  // single owner of vertical scroll on these pages.
  //
  // SCROLL FIX: This wrapper must be a plain block div — NOT flex.
  // Using flex-grow / flex-1 here clamped the wrapper to its flex
  // parent's height, so content taller than the viewport was clipped
  // and the outer scroll container never saw any overflow.
  // `min-height: 100%` guarantees short pages still fill the screen.
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        id="page-scroll-container"
        className="w-full min-h-full block bg-background"
        style={{ position: 'relative', pointerEvents: 'auto' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
