import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  triggered: boolean;
}

/**
 * 🚀 Minimalistic PULL INDICATOR
 */
export const PullToRefreshIndicator = memo(({ pullDistance, isRefreshing, triggered }: Props) => {
  const isVisible = pullDistance > 10 || isRefreshing;
  
  const progress = Math.min(pullDistance / 80, 1);
  const scale = 0.8 + (progress * 0.2); 

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.5 }}
          animate={{ 
            y: isRefreshing ? 40 : pullDistance - 10, 
            opacity: 1,
            scale: isRefreshing ? 1 : scale,
          }}
          exit={{ y: -40, opacity: 0, scale: 0.5 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className="fixed top-0 left-0 right-0 z-[10010] flex justify-center pointer-events-none pt-safe"
        >
          <div className="relative group mt-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-200",
                "bg-white/10 dark:bg-black/60 backdrop-blur-xl border border-white/20 shadow-md",
                triggered && "border-brand-primary bg-brand-primary/10"
              )}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <div 
                  className="transition-transform duration-200"
                  style={{ transform: `rotate(${progress * 180}deg)` }}
                >
                  <ArrowDown 
                    className={cn(
                      "w-4 h-4 transition-all duration-300",
                      triggered ? "text-brand-primary" : "text-white opacity-60"
                    )} 
                    strokeWidth={2}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PullToRefreshIndicator.displayName = 'PullToRefreshIndicator';
