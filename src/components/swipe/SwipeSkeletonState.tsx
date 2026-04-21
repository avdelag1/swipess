import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';

export const SwipeSkeletonState = () => {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="skeleton" 
        variants={deckFadeVariants} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col px-3 bg-background"
      >
        <div className="relative flex-1 w-full">
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              transform: 'translateZ(0)',
              contain: 'paint',
            }}
          >
            {/* Base gradient - matches TinderSwipeCard skeleton */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 35%, #cbd5e1 65%, #94a3b8 100%)',
              }}
            />
            {/* Animated shimmer - GPU accelerated */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 75%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.2s ease-in-out infinite',
                transform: 'translateZ(0)',
              }}
            />
            {/* Story dots placeholder */}
            <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={`skeleton-dot-${num}`} className="flex-1 h-1 rounded-full bg-white/30" />
              ))}
            </div>
            {/* Bottom sheet skeleton */}
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
        {/* Action buttons skeleton */}
        <div className="flex-shrink-0 flex justify-center items-center py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted/40 animate-pulse" />
            <div className="w-11 h-11 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-11 h-11 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-14 h-14 rounded-full bg-muted/40 animate-pulse" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

