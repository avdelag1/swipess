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
  return (
    <div
      className={cn(
        minimal ? 'p-2' : 'min-h-screen min-h-dvh flex items-center justify-center',
        className
      )}
      aria-hidden="true"
    >
      {!minimal && (
        <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground/60 animate-spin" />
      )}
    </div>
  );
}

export default SuspenseFallback;
