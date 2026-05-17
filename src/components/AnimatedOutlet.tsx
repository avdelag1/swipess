import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  if (isDashboardRoute) {
    return (
      <div
        className="min-h-full w-full flex flex-col flex-1 bg-transparent"
        style={{ position: 'relative', pointerEvents: 'none' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.10, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full flex flex-col bg-transparent"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <Suspense fallback={null}>
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
    <div
      key={location.pathname}
      id="page-scroll-container"
      className="w-full bg-background"
      style={{ position: 'relative', pointerEvents: 'auto', minHeight: '100%' }}
    >
      <Suspense fallback={null}>
        {outlet}
      </Suspense>
    </div>
  );
}
