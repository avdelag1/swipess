import { Suspense, useMemo } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useViewTransitions } from '@/hooks/useViewTransitions';

/** Routes whose real UI lives in a persistent scene under the outlet. */
function isPersistentSceneRoute(pathname: string): boolean {
  if (
    pathname === '/client/dashboard' ||
    pathname === '/owner/dashboard' ||
    pathname.startsWith('/client/dashboard/') ||
    pathname.startsWith('/owner/dashboard/')
  ) {
    return true;
  }
  // Events feed is PersistentEventsScene — outlet must stay transparent
  // or an opaque page shell covers the feed and it looks “blank”.
  return pathname === '/explore/events' || pathname === '/explore/events/';
}

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const { isSupported } = useViewTransitions();

  const isPersistent = useMemo(
    () => isPersistentSceneRoute(location.pathname),
    [location.pathname],
  );

  const containerStyle = useMemo(() => ({
    position: isPersistent ? 'absolute' as const : 'relative' as const,
    inset: isPersistent ? 0 : undefined,
    background: isPersistent ? 'transparent' : 'hsl(var(--background))',
    viewTransitionName: isSupported && !isPersistent ? 'swipess-page-content' : undefined,
  }), [isPersistent, isSupported]);

  const SuspenseFallback = () => (
    <div
      className="flex-1 w-full"
      aria-busy="true"
      aria-label="Loading content"
    />
  );

  // Skip view-transition wrappers on persistent scenes — they paint an
  // opaque shell over PersistentDashboardScene / PersistentEventsScene.
  if (isSupported && !isPersistent) {
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
      className="min-h-full w-full flex flex-col flex-1 ambient-page-shell"
      style={{
        position: 'relative',
        pointerEvents: isPersistent ? 'none' : 'auto',
      }}
    >
      <div
        key={location.pathname}
        id={isPersistent ? undefined : 'page-scroll-container'}
        className={
          isPersistent
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
