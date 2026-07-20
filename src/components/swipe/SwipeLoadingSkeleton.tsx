import { motion } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';

export interface SwipeLoadingSkeletonProps {
  category?: string;
}

/**
 * GPU-friendly skeleton for swipe deck first load / category switch.
 * Content-aware: Layout changes based on the active category (properties, yachts, people, etc).
 */
export const SwipeLoadingSkeleton = ({ category = 'property' }: SwipeLoadingSkeletonProps) => {
  // Determine layout based on category
  const isYacht = category === 'yacht';
  const isVehicle = ['motorcycle', 'bicycle', 'auto'].includes(category);
  const isPeople = ['services', 'worker', 'hire', 'buyers', 'renters', 'all-clients'].includes(category);
  const isProperty = !isYacht && !isVehicle && !isPeople;

  return (
    <motion.div
      key="skeleton"
      variants={deckFadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3"
    >
      <div className="relative flex-1 w-full rounded-[32px] overflow-hidden border border-white/10 bg-[#050505] shadow-2xl">
        <div className="absolute inset-0 overflow-hidden transform-gpu contain-paint">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-70" />
          
          {/* Enhanced premium shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent bg-[length:200%_100%] animate-shimmer transform-gpu" />

          {/* Top Story Dots */}
          <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={`skeleton-dot-${num}`} className="flex-1 h-[3px] rounded-full bg-white/[0.14] route-skeleton-bar" style={{ animationDelay: `${num * 0.15}s` }} />
            ))}
          </div>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
            
            {/* Main Title & Price Row */}
            <div className="flex justify-between items-end mb-4">
              <div className="flex-1 space-y-3 pr-4">
                {/* Title Line */}
                <div className="h-7 w-3/4 bg-white/10 rounded-lg route-skeleton-bar" />
                {/* Location Line */}
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-white/10 route-skeleton-bar" />
                  <div className="h-4 w-1/2 bg-white/5 rounded-lg route-skeleton-bar" />
                </div>
              </div>
              {/* Price Badge */}
              {isPeople ? (
                 <div className="h-8 w-20 bg-emerald-500/10 rounded-full route-skeleton-bar border border-emerald-500/20" />
              ) : (
                 <div className="h-8 w-24 bg-white/10 rounded-xl route-skeleton-bar" />
              )}
            </div>

            {/* Content-Aware Attribute Pills */}
            <div className="flex gap-2 flex-wrap">
              {isProperty && (
                <>
                  <div className="h-7 w-16 rounded-full border border-white/10 bg-white/5 route-skeleton-bar" />
                  <div className="h-7 w-16 rounded-full border border-white/10 bg-white/5 route-skeleton-bar" />
                  <div className="h-7 w-20 rounded-full border border-white/10 bg-white/5 route-skeleton-bar" />
                </>
              )}
              {isYacht && (
                <>
                  <div className="h-7 w-24 rounded-full border border-teal-500/20 bg-teal-500/10 route-skeleton-bar" />
                  <div className="h-7 w-20 rounded-full border border-teal-500/20 bg-teal-500/10 route-skeleton-bar" />
                  <div className="h-7 w-16 rounded-full border border-teal-500/20 bg-teal-500/10 route-skeleton-bar" />
                </>
              )}
              {isVehicle && (
                <>
                  <div className="h-7 w-16 rounded-full border border-orange-500/20 bg-orange-500/10 route-skeleton-bar" />
                  <div className="h-7 w-24 rounded-full border border-orange-500/20 bg-orange-500/10 route-skeleton-bar" />
                  <div className="h-7 w-20 rounded-full border border-orange-500/20 bg-orange-500/10 route-skeleton-bar" />
                </>
              )}
              {isPeople && (
                <div className="w-full space-y-2 mt-2">
                  <div className="h-3 w-full bg-white/5 rounded-lg route-skeleton-bar" />
                  <div className="h-3 w-5/6 bg-white/5 rounded-lg route-skeleton-bar" />
                  <div className="h-3 w-4/6 bg-white/5 rounded-lg route-skeleton-bar" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Thumbs Up / Down) */}
      <div className="flex-shrink-0 flex justify-center items-center py-5 px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl animate-pulse" />
          <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};