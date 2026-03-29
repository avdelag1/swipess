import { cn } from '@/lib/utils';
import { PremiumLoader } from '../PremiumLoader';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

/**
 * TINDER-SPEED SUSPENSE FALLBACK
 *
 * For in-app navigation: renders NOTHING for the first 150ms (the chunk usually
 * loads within that window), then shows a subtle skeleton. This prevents the
 * jarring full-screen black flash that made page transitions feel slow.
 *
 * For cold starts (minimal=false + no prior navigation): shows the full premium loader.
 */

// Track whether the app has completed its first render — once true, all subsequent
// suspense boundaries use the lightweight "invisible then skeleton" approach.
let hasCompletedFirstRender = false;

// Set this after a short delay so the very first page load still gets the premium loader
if (typeof window !== 'undefined') {
  // After 2s the app is definitely past initial load
  setTimeout(() => { hasCompletedFirstRender = true; }, 2000);
  
  // IMMEDIATELY disable splash once app signals it is rendered
  window.addEventListener('app-rendered', () => {
    hasCompletedFirstRender = true;
  });
}

export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  // After first render, ALL suspense fallbacks are minimal — zero visual disruption
  if (minimal || hasCompletedFirstRender) {
    return (
      <div
        className={cn(
          "h-full w-full",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  // Full splash version - only for very first cold load
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9f9fb] overflow-hidden overscroll-none touch-none',
        className
      )}
      aria-hidden="true"
    >
      <PremiumLoader size="lg" />
    </div>
  );
}

export default SuspenseFallback;
