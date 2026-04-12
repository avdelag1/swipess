import { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useSpring } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { triggerHaptic } from '@/utils/haptics';

export function LiquidPullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const scrollRef = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const controls = useAnimation();
  
  const springPull = useSpring(0, { stiffness: 300, damping: 30 });
  
  useEffect(() => {
    springPull.onChange((v) => setPullProgress(v));
    return () => springPull.clearListeners();
  }, [springPull]);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    scrollRef.current = mainContent;

    let touchStartY = 0;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (mainContent.scrollTop <= 0) {
        touchStartY = e.touches[0].clientY;
        isTouching = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || isRefreshing) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;
      
      if (mainContent.scrollTop <= 0 && deltaY > 0) {
        // We are pulling down from the top
        const resistance = 0.4;
        const boundedDelta = Math.min(deltaY * resistance, 150);
        springPull.set(boundedDelta / 150);

        if (boundedDelta > 80 && !isRefreshing) {
          triggerHaptic('light');
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isTouching) return;
      isTouching = false;
      const progress = springPull.get();
      
      if (progress > 0.6 && !isRefreshing) {
        // Trigger refresh
        setIsRefreshing(true);
        triggerHaptic('success');
        springPull.set(1); // lock it 
        
        await queryClient.invalidateQueries();
        await new Promise(r => setTimeout(r, 1000)); // wait at least 1s for the animation
        
        setIsRefreshing(false);
        springPull.set(0);
      } else {
        springPull.set(0); // snap back
      }
    };

    mainContent.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainContent.addEventListener('touchmove', handleTouchMove, { passive: true });
    mainContent.addEventListener('touchend', handleTouchEnd);
    mainContent.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      mainContent.removeEventListener('touchstart', handleTouchStart);
      mainContent.removeEventListener('touchmove', handleTouchMove);
      mainContent.removeEventListener('touchend', handleTouchEnd);
      mainContent.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isRefreshing, queryClient, springPull]);

  if (pullProgress === 0 && !isRefreshing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex justify-center">
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
        style={{
          y: Math.max(-50, pullProgress * 100 - 50),
          scale: 0.5 + pullProgress * 0.5,
          opacity: pullProgress,
          background: 'rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.2)'
        }}
      >
        {isRefreshing ? (
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ transform: `scale(${pullProgress})` }} />
        )}
      </motion.div>
    </div>
  );
}
