import useAppTheme from "@/hooks/useAppTheme";
import { motion } from 'framer-motion';
import useAppTheme from "@/hooks/useAppTheme";
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
    className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3"
  >
    <div className={cn("relative flex-1 w-full rounded-[32px] overflow-hidden border", isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#050505]")}>
      {/* Clean loading surface */}
      <div className="absolute inset-0 overflow-hidden transform-gpu contain-paint">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-60" />

        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer transform-gpu"
        />

        {/* Top Progress Indicators */}
        <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={`skeleton-dot-${num}`} className="flex-1 h-[2px] rounded-full bg-white/10" />
          ))}
        </div>

        {/* Info Block at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/5 p-6 pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 bg-white/20 rounded-full animate-pulse" />
          </div>
          <div className="flex justify-between items-end mb-4">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 bg-white/10 rounded-lg animate-pulse" />
              <div className={cn("h-4 w-1/2 rounded-lg animate-pulse", isLight ? "bg-slate-100" : "bg-white/5")} />
            </div>
            <div className="text-right space-y-2">
              <div className="h-7 w-24 bg-white/10 rounded-lg animate-pulse" />
              <div className={cn("h-3 w-16 rounded-lg ml-auto animate-pulse", isLight ? "bg-slate-100" : "bg-white/5")} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className={cn("h-5 w-14 rounded-full border", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
            <div className={cn("h-5 w-14 rounded-full border", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
            <div className={cn("h-5 w-18 rounded-full border", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
          </div>
        </div>

        {/* Center Loading Status */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <motion.div 
             animate={{ opacity: [0.5, 1, 0.5] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="text-center"
           >
           </motion.div>
        </div>
      </div>
    </div>

    {/* Bottom Control Circle Skeletons */}
    <div className="flex-shrink-0 flex justify-center items-center py-5 px-4">
      <div className="flex items-center gap-4">
        <div className={cn("w-11 h-11 rounded-full border animate-pulse", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
        <div className={cn("w-10 h-10 rounded-full border animate-pulse", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
        <div className={cn("w-10 h-10 rounded-full border animate-pulse", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
        <div className={cn("w-11 h-11 rounded-full border animate-pulse", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")} />
      </div>
    </div>
  </motion.div>
);


