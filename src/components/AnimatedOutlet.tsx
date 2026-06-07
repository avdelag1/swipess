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
      <AnimatePresence mode="sync" initial={false}>
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
          initial={isDashboardRoute ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
          animate={isDashboardRoute ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={isDashboardRoute ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
          transition={isDashboardRoute
            ? { type: 'tween', duration: 0.05, ease: 'easeOut' }
            : { type: 'spring', stiffness: 800, damping: 24, mass: 0.4 }
          }
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
