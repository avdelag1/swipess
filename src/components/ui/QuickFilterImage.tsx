import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickFilterImageProps {
  src: string | string[];
  alt: string;
  className?: string;
  animationDelay?: string;
}

/**
 * Image for quick filter cards.
 * Uses Framer Motion for a beautiful crossfade/blur transition, and allows manual swiping.
 */
export function QuickFilterImage({ src, alt, className, animationDelay = '0s' }: QuickFilterImageProps) {
  const images = Array.isArray(src) ? src : [src];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    // EXACT staggered interval (1 card every 5s)
    const delayS = parseFloat(animationDelay.replace('s', '')) || 0;
    const baseInterval = 5000; 
    const exactOffset = delayS * 1000;

    let timeoutId: ReturnType<typeof setTimeout>;

    const rotate = () => {
      setActiveIndex(prev => (prev + 1) % images.length);
      timeoutId = setTimeout(rotate, baseInterval);
    };

    timeoutId = setTimeout(rotate, baseInterval + exactOffset);

    return () => clearTimeout(timeoutId);
  }, [images.length, animationDelay]);

  if (images.length <= 1) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50">
        <img
          src={images[0]}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={cn("absolute inset-0 w-full h-full object-cover", className)}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50 pointer-events-auto touch-none">
      {/* Invisible drag surface to capture swipes without blocking taps */}
      <motion.div
        className="absolute inset-0 w-full h-full z-20"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, { offset }) => {
          if (offset.x < -30) {
            setActiveIndex(prev => (prev + 1) % images.length);
          } else if (offset.x > 30) {
            setActiveIndex(prev => (prev - 1 + images.length) % images.length);
          }
        }}
      />
      
      {/* Overlapping images for smooth crossfade */}
      <AnimatePresence>
        <motion.img
          key={activeIndex}
          src={images[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none z-10", className)}
        />
      </AnimatePresence>
    </div>
  );
}

