import { motion } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';

/**
 * SwipeLoadingSkeleton - GPU-accelerated skeleton shown on first load before data hydration.
 * Matches the Tinder-style card deck layout.
 */
export const SwipeLoadingSkeleton = () => (
  <motion.div 
    key="skeleton" 
    variants={deckFadeVariants} 
    initial="initial" 
    animate="animate" 
    exit="exit" 
    className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3 bg-background"
  >
    <div className="relative flex-1 w-full">
      <div className="absolute inset-0 overflow-hidden transform-gpu contain-paint">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%] animate-shimmer transform-gpu"
        />
        <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={`skeleton-dot-${num}`} className="flex-1 h-1 rounded-full bg-white/30" />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 rounded-t-[24px] p-4 pt-6">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1.5 bg-white/30 rounded-full" />
          </div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-white/20 rounded-lg" />
              <div className="h-4 w-1/2 bg-white/15 rounded-lg" />
            </div>
            <div className="text-right space-y-1">
              <div className="h-6 w-20 bg-white/20 rounded-lg" />
              <div className="h-3 w-12 bg-white/15 rounded-lg ml-auto" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-4 w-12 bg-white/15 rounded-full" />
            <div className="h-4 w-12 bg-white/15 rounded-full" />
            <div className="h-4 w-16 bg-white/15 rounded-full" />
          </div>
        </div>
      </div>
    </div>
    <div className="flex-shrink-0 flex justify-center items-center py-3 px-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-muted/40 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-muted/30 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-muted/30 animate-pulse" />
        <div className="w-14 h-14 rounded-full bg-muted/40 animate-pulse" />
      </div>
    </div>
  </motion.div>
);


