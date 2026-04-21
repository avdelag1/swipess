import { memo, useEffect } from 'react';
import { Skeleton } from './skeleton';
import { cn, runIdleTask } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

/**
 * 🚀 DiscoverySkeleton: Premium, Zenith-level skeleton loader
 * - Mimics the 'ClientCard' and 'EventCard' hierarchy
 * - Staggered implementation for 'Speed of Light' experience
 * - Predictive orientation: Prefetches critical route assets while visible
 */
export const DiscoverySkeleton = memo(({ count = 3 }: { count?: number }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    // 🚀 SPEED OF LIGHT: Predictive pre-warming
    // While the user is focused on the skeleton, we silently prefetch high-traffic assets
    runIdleTask(() => {
      const brandLogo = new Image();
      brandLogo.src = '/icons/Swipess-brand-logo.webp';
    });
  }, []);

  return (
    <div className="space-y-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "relative w-full rounded-[2.5rem] p-5 border backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-700",
            isLight 
              ? "bg-white/40 border-slate-200/50" 
              : "bg-black/40 border-white/10",
            i === 1 && "opacity-80",
            i === 2 && "opacity-60",
            i >= 3 && "opacity-40"
          )}
        >
          {/* Main Visual Placeholder */}
          <div className="flex items-center gap-5">
            <Skeleton className="w-24 h-24 rounded-[1.8rem] shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-1/2 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full rounded-2xl" />
            </div>
          </div>

          {/* Details Row Placeholder */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
             <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
             </div>
             <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
});


