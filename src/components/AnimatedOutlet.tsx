import { useOutlet } from 'react-router-dom';
import { Suspense } from 'react';
import { SuspenseFallback } from './ui/suspense-fallback';

export function AnimatedOutlet() {
  const outlet = useOutlet();

  return (
    <div
      className="h-full min-h-0 w-full flex flex-col flex-1"
      style={{ position: 'relative' }}
    >
      <Suspense fallback={<SuspenseFallback minimal />}>
        {outlet}
      </Suspense>
    </div>
  );
}

