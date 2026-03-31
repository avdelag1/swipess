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
  // If not minimal, make it full-screen fixed to match splash perfectly
  return <PremiumLoader size="lg" full={!minimal} className={className} />;
}


export default SuspenseFallback;
