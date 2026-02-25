/**
 * Ultra-lightweight loading fallback for Suspense boundaries
 * Designed to be nearly invisible - routes should already be prefetched
 */

import { cn } from '@/lib/utils';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  // Always use minimal fallback - routes should be preloaded
  // This only shows briefly if route wasn't prefetched
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        minimal ? 'p-2' : 'min-h-[100px]',
        className
      )}
    >
      {/* Tiny, subtle spinner - barely visible */}
      <div
        className="w-5 h-5 border-2 border-primary/20 border-t-primary/60 rounded-full animate-spin"
        style={{
          animationDuration: '0.6s',
        }}
      />
    </div>
  );
}

export default SuspenseFallback;
