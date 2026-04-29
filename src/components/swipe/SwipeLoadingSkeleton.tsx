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
    className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3"
  >
    <div className="relative flex-1 w-full rounded-[32px] overflow-hidden border border-white/10 bg-[#050505]">
      {/* 🛸 RADAR ATMOSPHERE */}
      <div className="absolute inset-0 overflow-hidden transform-gpu contain-paint">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-60" />
        
        {/* Radar Circular Grid */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-[150%] h-[150%] border border-white/20 rounded-full" />
          <div className="absolute w-[100%] h-[100%] border border-white/20 rounded-full" />
          <div className="absolute w-[50%] h-[50%] border border-white/20 rounded-full" />
        </div>

        {/* 🛰️ RADAR SWEEPING PULSE */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-50%] origin-center"
          style={{
            background: 'conic-gradient(from 0deg, rgba(236, 72, 153, 0.3) 0%, transparent 25%, transparent 100%)',
          }}
        />

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
              <div className="h-4 w-1/2 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-7 w-24 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded-lg ml-auto animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-14 bg-white/5 rounded-full border border-white/10" />
            <div className="h-5 w-14 bg-white/5 rounded-full border border-white/10" />
            <div className="h-5 w-18 bg-white/5 rounded-full border border-white/10" />
          </div>
        </div>

        {/* Center Loading Status */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <motion.div 
             animate={{ opacity: [0.5, 1, 0.5] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="text-center"
           >
             <h3 className="text-white text-3xl font-black uppercase tracking-widest italic drop-shadow-lg">SWIPESS</h3>
             <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mt-3">Loading profiles...</p>
           </motion.div>
        </div>
      </div>
    </div>

    {/* Bottom Control Circle Skeletons */}
    <div className="flex-shrink-0 flex justify-center items-center py-5 px-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 animate-pulse" />
      </div>
    </div>
  </motion.div>
);


