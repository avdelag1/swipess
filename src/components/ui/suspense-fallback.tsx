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
  // Invisible fallback — pages should already be prefetched.
  // Returning a transparent placeholder avoids the white-flash blink
  // that would otherwise occur during the brief Suspense resolution frame.
  return (
    <div
      className={cn(
        minimal ? 'p-2' : 'min-h-[100px]',
        className
      )}
      aria-hidden="true"
    />
  );
}

export default SuspenseFallback;
