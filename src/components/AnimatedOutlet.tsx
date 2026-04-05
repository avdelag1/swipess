import { useLocation, useOutlet } from 'react-router-dom';
import { Suspense } from 'react';
import { SuspenseFallback } from './ui/suspense-fallback';

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const isFixedViewportRoute = location.pathname.startsWith('/radio');

  return (
    <div
      key={location.pathname}
      className={isFixedViewportRoute
        ? "h-full w-full flex flex-col flex-1"
        : "h-full w-full flex flex-col flex-1 gpu-accelerate overflow-hidden"}
      style={{ position: 'relative' }}
    >
      <Suspense fallback={<SuspenseFallback minimal />}>
        {outlet}
      </Suspense>
    </div>
  );
}
