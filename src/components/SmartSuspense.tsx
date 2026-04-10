import { Suspense, useEffect, useState, type ReactNode } from 'react';

interface SmartSuspenseProps {
  children: ReactNode;
  fallback: ReactNode;
  threshold?: number;
}

/**
 * SMART SUSPENSE — THE "INSTANT" LOADER
 * 
 * Tracks lazy-load state and prevents
 * "skeleton flashes" for fast loads by showing a transparent fallback initially.
 */
export const SmartSuspense = ({ children, fallback, threshold = 100 }: SmartSuspenseProps) => {
  return (
    <Suspense fallback={<SuspenseWrapper fallback={fallback} threshold={threshold} />}>
      {children}
    </Suspense>
  );
};

// Internal wrapper to track mount/unmount of the actual fallback
const SuspenseWrapper = ({ fallback, threshold }: { fallback: ReactNode; threshold: number }) => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShowSkeleton(true), threshold);
    return () => clearTimeout(id);
  }, [threshold]);

  return showSkeleton ? <>{fallback}</> : <div className="h-full w-full bg-transparent" />;
};
