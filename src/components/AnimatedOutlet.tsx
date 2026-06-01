import { useLocation, useOutlet } from 'react-router-dom';
import { Suspense, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();

  const isDashboardRoute = useMemo(() =>
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/'),
  [location.pathname]);

  return (
    <div
      className="min-h-full w-full flex flex-col flex-1"
      style={{
        position: 'relative',
        pointerEvents: isDashboardRoute ? 'none' : 'auto',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          id={isDashboardRoute ? undefined : 'page-scroll-container'}
          className={
            isDashboardRoute
              ? 'flex-1 w-full flex flex-col pointer-events-none-force'
              : 'swipess-page-wrapper w-full min-h-full block'
          }
          style={{
            position: isDashboardRoute ? 'absolute' as const : 'relative' as const,
            inset: isDashboardRoute ? 0 : undefined,
            background: isDashboardRoute ? 'transparent' : 'hsl(var(--background))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center w-full min-h-[200px]">
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
