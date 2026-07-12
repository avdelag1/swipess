import { motion } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';

/**
 * GPU-friendly skeleton for swipe deck first load / category switch.
 */
export const SwipeLoadingSkeleton = () => (
  <motion.div
    key="skeleton"
    variants={deckFadeVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3"
  >
    <div className="relative flex-1 w-full rounded-[32px] overflow-hidden border border-white/10 bg-[#050505]">
      <div className="absolute inset-0 overflow-hidden transform-gpu contain-paint">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer transform-gpu" />

        <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={`skeleton-dot-${num}`} className="flex-1 h-[2px] rounded-full bg-white/10" />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-3xl border-t border-white/10 rounded-t-[24px] p-6 pt-8">
          <div className="flex justify-between items-end mb-4">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 bg-white/10 rounded-lg route-skeleton-bar" />
              <div className="h-4 w-1/2 bg-white/5 rounded-lg route-skeleton-bar" />
            </div>
            <div className="h-7 w-24 bg-white/10 rounded-lg route-skeleton-bar" />
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-14 rounded-full border border-white/10 bg-white/5" />
            <div className="h-5 w-14 rounded-full border border-white/10 bg-white/5" />
      </div>
    </div>

      <div className="flex-shrink-0 flex justify-center items-center py-5 px-4">
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl animate-pulse" />
          ))}
        </div>
      </div>
  </motion.div>
);