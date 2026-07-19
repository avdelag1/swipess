import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const controls = useAnimation();

  // Thresholds
  const MAX_PULL = 120;
  const REFRESH_THRESHOLD = 75;

  const yOffsetSpinner = useTransform(pullY, [0, MAX_PULL], [-50, 40]);
  const spinnerOpacity = useTransform(pullY, [0, REFRESH_THRESHOLD], [0, 1]);
  const spinnerRotate = useTransform(pullY, [0, REFRESH_THRESHOLD], [0, 360]);
  const spinnerScale = useTransform(pullY, [0, REFRESH_THRESHOLD], [0.5, 1]);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if we are at the very top of the page
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      } else {
        isPulling = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      currentY = e.touches[0].clientY;
      const dy = currentY - startY;

      // Only respond to downward pulls
      if (dy > 0 && window.scrollY <= 0) {
        // Apply resistance (rubber-band effect)
        const resistance = dy * 0.4;
        const boundedY = Math.min(resistance, MAX_PULL);
        
        pullY.set(boundedY);
        controls.set({ y: boundedY });
        
        if (boundedY > REFRESH_THRESHOLD * 0.9) {
          triggerHaptic('light');
        }
        
        // Prevent default scrolling when pulling down
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      isPulling = false;

      const finalY = pullY.get();

      if (finalY >= REFRESH_THRESHOLD && !isRefreshing) {
        triggerHaptic('heavy');
        setIsRefreshing(true);
        
        // Snap to refresh position
        await controls.start({ 
          y: 60,
          transition: { type: 'spring', stiffness: 400, damping: 25 }
        });

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          // Animate back up
          controls.start({ 
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
          });
          pullY.set(0);
        }
      } else {
        // Not pulled far enough, snap back
        controls.start({ 
          y: 0,
          transition: { type: 'spring', stiffness: 400, damping: 25 }
        });
        pullY.set(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, onRefresh, controls, pullY]);

  return (
    <>
      {/* Absolute positioned spinner that reveals from behind the header/top edge */}
      <motion.div
        className="fixed top-0 left-0 w-full flex justify-center items-start pt-6 z-[100] pointer-events-none"
        style={{
          opacity: isRefreshing ? 1 : spinnerOpacity,
        }}
      >
        <motion.div
          className="bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full shadow-lg p-2.5 border border-black/5 dark:border-white/10"
          style={{
            y: isRefreshing ? 20 : yOffsetSpinner,
            scale: isRefreshing ? 1 : spinnerScale,
            rotate: isRefreshing ? undefined : spinnerRotate,
          }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
        >
          <Loader2 className="w-5 h-5 text-black dark:text-white" />
        </motion.div>
      </motion.div>

      {/* Main content wrapper that shifts down when pulled */}
      <motion.div
        animate={controls}
        className="w-full min-h-screen"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </>
  );
}
