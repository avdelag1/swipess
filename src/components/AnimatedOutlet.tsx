import { Suspense, useMemo } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useViewTransitions } from '@/hooks/useViewTransitions';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const { isSupported } = useViewTransitions();

  const isDashboardRoute = useMemo(() =>
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard' ||
    location.pathname.startsWith('/client/dashboard/') ||
    location.pathname.startsWith('/owner/dashboard/'),
  [location.pathname]);

  const containerStyle = useMemo(() => ({
    position: isDashboardRoute ? 'absolute' as const : 'relative' as const,
    inset: isDashboardRoute ? 0 : undefined,
    background: isDashboardRoute ? 'transparent' : 'hsl(var(--background))',
    viewTransitionName: isSupported ? 'swipess-page-content' : undefined,
  }), [isDashboardRoute, isSupported]);

  const SuspenseFallback = () => (
    <div
      className="swipess-page-skeleton w-full min-h-[60vh] flex flex-col"
      style={{
        viewTransitionName: isSupported ? 'swipess-page-skeleton' : undefined,
        contain: 'layout style paint',
      }}
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="h-16 w-full bg-muted/30 animate-pulse" style={{ contain: 'layout paint' }} />
      <div className="flex-1 p-4 space-y-4">
        <div className="h-8 w-3/4 bg-muted/30 animate-pulse rounded" style={{ contain: 'layout paint' }} />
        <div className="h-8 w-1/2 bg-muted/30 animate-pulse rounded" style={{ contain: 'layout paint' }} />
        <div className="h-32 w-full bg-muted/30 animate-pulse rounded-lg" style={{ contain: 'layout paint' }} />
        <div className="h-32 w-full bg-muted/30 animate-pulse rounded-lg" style={{ contain: 'layout paint' }} />
        <div className="h-32 w-full bg-muted/30 animate-pulse rounded-lg" style={{ contain: 'layout paint' }} />
      </div>
      <div className="h-16 w-full bg-muted/30 animate-pulse" style={{ contain: 'layout paint' }} />
    </div>
  );

  if (isSupported && !isDashboardRoute) {
    return (
      <div
        className="min-h-full w-full flex flex-col flex-1"
        style={{
          position: 'relative',
          pointerEvents: 'auto',
        }}
      >
        <Suspense fallback={<SuspenseFallback />}>
          <div
            key={location.pathname}
            id="page-scroll-container"
            className="swipess-page-wrapper w-full min-h-full block view-transition-page"
            style={containerStyle}
          >
            {outlet}
          </div>
        </Suspense>
      </div>
    );
  }

  return (
    <div
      className="min-h-full w-full flex flex-col flex-1"
      style={{
        position: 'relative',
        pointerEvents: isDashboardRoute ? 'none' : 'auto',
      }}
    >
      <div
        key={location.pathname}
        id={isDashboardRoute ? undefined : 'page-scroll-container'}
        className={
          isDashboardRoute
            ? 'flex-1 w-full flex flex-col pointer-events-none-force'
            : 'swipess-page-wrapper w-full min-h-full block'
        }
        style={containerStyle}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {outlet}
        </Suspense>
      </div>
    </div>
  );
}
