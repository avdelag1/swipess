import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense, useState, useEffect } from 'react';
import { SuspenseFallback } from './ui/suspense-fallback';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const [fadeClass, setFadeClass] = useState('opacity-100');

  useEffect(() => {
    setFadeClass('opacity-0');
    const raf = requestAnimationFrame(() => {
      setFadeClass('opacity-100');
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div
      className={`h-full min-h-0 w-full flex flex-col flex-1 transition-opacity duration-150 ease-out ${fadeClass}`}
      style={{ position: 'relative' }}
    >
      <Suspense fallback={<SuspenseFallback minimal />}>
        {outlet}
      </Suspense>
    </div>
  );
}
