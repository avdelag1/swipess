import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipessLogo } from './SwipessLogo';
import { cn } from '@/lib/utils';

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  triggered: boolean;
}

/**
 * 🚀 NEXUS PULL INDICATOR
 * A premium, glassmorphic pull-to-refresh indicator that replaces the generic spinner.
 * Features:
 * - Liquid-glass background
 * - Branded logo that fills up with a glow
 * - Smooth rubber-band physics via framer-motion
 */
export const PullToRefreshIndicator = memo(({ pullDistance, isRefreshing, triggered }: Props) => {
  // Only show if we've pulled a bit or are currently refreshing
  const isVisible = pullDistance > 10 || isRefreshing;
  
  // Progress from 0 to 1 based on trigger threshold (80px)
  const progress = Math.min(pullDistance / 80, 1);
  const scale = 0.8 + (progress * 0.3); // Scales up as you pull
  const rotation = pullDistance * 2; // Subtle rotation

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.5 }}
          animate={{ 
            y: isRefreshing ? 40 : pullDistance - 20, 
            opacity: 1,
            scale: isRefreshing ? 1.1 : scale,
          }}
          exit={{ y: -80, opacity: 0, scale: 0.5 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className="fixed top-0 left-0 right-0 z-[10010] flex justify-center pointer-events-none"
        >
          <div className="relative group">
            {/* 🌌 OUTER GLOW: Pulses when triggered or refreshing */}
            {(triggered || isRefreshing) && (
              <motion.div
                layoutId="pull-glow"
                className="absolute inset-0 rounded-full bg-brand-primary/25 blur-xl"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* 💎 GLASS CONTAINER */}
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300",
                "bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl",
                triggered && "border-brand-primary/50 shadow-brand-primary/20",
                isRefreshing && "animate-pulse"
              )}
            >
              {/* 💧 LIQUID FILL: Fills up the circle as you pull */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-brand-primary/20"
                style={{ height: `${progress * 100}%` }}
                animate={isRefreshing ? { height: '100%', opacity: [0.2, 0.4, 0.2] } : {}}
              />

              {/* 🔄 ROTATING RING (Only visible while refreshing) */}
              {isRefreshing && (
                <motion.div
                  className="absolute inset-1 rounded-full border-2 border-t-brand-primary border-r-brand-primary border-b-transparent border-l-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* 🏷️ LOGO */}
              <div 
                className="relative z-10 transition-transform duration-200"
                style={{ transform: `rotate(${isRefreshing ? 0 : rotation}deg)` }}
              >
                <SwipessLogo 
                  variant="white" 
                  size="sm" 
                  className={cn(
                    "transition-all duration-300",
                    (triggered || isRefreshing) ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-white/40"
                  )} 
                />
              </div>
            </div>

            {/* 🚀 TRIGGER LABEL: Shown when threshold met */}
            {triggered && !isRefreshing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 20 }}
                className="absolute top-full left-1/2 -translate-x-1/2"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary whitespace-nowrap bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-brand-primary/30">
                  Release to Refresh
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PullToRefreshIndicator.displayName = 'PullToRefreshIndicator';
