import { cn } from '@/lib/utils';
import { PremiumLoader } from '../PremiumLoader';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

// Global flag so we only show full loader on true cold start
let hasCompletedFirstRender = false;

if (typeof window !== 'undefined') {
  setTimeout(() => { hasCompletedFirstRender = true; }, 2000);
  window.addEventListener('app-rendered', () => {
    hasCompletedFirstRender = true;
  });
}

/**
 * PRODUCTION-READY SKELETON
 * 
 * Replaces any 'flash of white' with a high-fidelity skeleton that 
 * matches the SwipessSwipeContainer layout perfectly.
 */
export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  // ALWAYS return the PremiumLoader centered for consistent 'alive' feel
  return (
    <div className={cn("flex-1 h-full w-full flex flex-col items-center justify-center min-h-[50vh] bg-black", className)}>
      <PremiumLoader size="lg" />
    </div>
  );
}


export default SuspenseFallback;
