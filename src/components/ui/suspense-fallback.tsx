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
  // After first render → super lightweight skeleton (Tinder/Instagram style)
  if (minimal || hasCompletedFirstRender) {
    return (
      <div className={cn("flex-1 p-4 overflow-hidden h-full w-full", className)}>
        {/* Header placeholder (matches dashboard header height) */}
        <div className="h-14 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-2xl mb-6 animate-pulse" />

        {/* Swipe card area — exact visual match to SwipessSwipeContainer */}
        <div className="relative max-w-md mx-auto">
          {/* Main card */}
          <div className="h-[520px] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden animate-pulse">
            {/* Fake image area */}
            <div className="h-3/4 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 relative">
              <div className="absolute bottom-6 left-6 right-6 h-6 bg-white/70 dark:bg-black/40 rounded-2xl" />
            </div>

            {/* Fake content rows */}
            <div className="p-6 space-y-3">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-16" />
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-24" />
              </div>
            </div>
          </div>

          {/* Fake next card peeking (depth illusion) */}
          <div className="absolute -bottom-4 left-4 right-4 h-[500px] bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-xl scale-95 -z-10 animate-pulse" />
        </div>

        {/* Bottom action bar placeholder */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl animate-pulse" />
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Cold start → full premium loader (your existing one)
  return <PremiumLoader />;
}

export default SuspenseFallback;
