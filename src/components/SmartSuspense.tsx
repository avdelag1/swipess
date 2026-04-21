import { Suspense, useEffect, useState } from 'react';
import { useLoadingStore } from '@/state/loadingStore';

interface SmartSuspenseProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  threshold?: number;
}

/**
 * SMART SUSPENSE — THE "INSTANT" LOADER
 * 
 * Tracks lazy-load state in the global loading store and prevents
 * "skeleton flashes" for fast loads by showing a transparent fallback initially.
 */
export const SmartSuspense = ({ children, fallback, threshold = 100 }: SmartSuspenseProps) => {
  const { start, finish } = useLoadingStore();

  return (
    <Suspense fallback={<SuspenseWrapper start={start} finish={finish} fallback={fallback} threshold={threshold} />}>
      {children}
    </Suspense>
  );
};

// Internal wrapper to track mount/unmount of the actual fallback
const SuspenseWrapper = ({ start, finish, fallback, threshold }: any) => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // Start global loading bar
    start();
    
    // Show actual skeleton only after threshold (to prevent flashes for fast loads)
    const id = setTimeout(() => setShowSkeleton(true), threshold);
    
    return () => {
      clearTimeout(id);
      // Finish global loading bar on unmount (meaning load completed)
      finish();
    };
  }, [start, finish, threshold]);

  // Before threshold: show nothing (prevents flicker). After threshold: show Skeleton.
  return showSkeleton ? <>{fallback}</> : <div className="h-full w-full bg-transparent" />;
};

