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

    // EXACT staggered interval (1 card every 4s, 10 cards total = 40s rotation cycle)
    const delayS = parseFloat(animationDelay.replace('s', '')) || 0;
    const baseInterval = 40000; 
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

  const isDragging = React.useRef(false);
  const pointerStartX = React.useRef(0);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50 pointer-events-auto touch-none">
      {/* Invisible drag surface to capture swipes without blocking taps */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          const threshold = 20;
          if (info.offset.x < -threshold) {
            setActiveIndex(prev => (prev + 1) % images.length);
          } else if (info.offset.x > threshold) {
            setActiveIndex(prev => (prev - 1 + images.length) % images.length);
          }
        }}
        // Stop propagation so parent motion components don't misinterpret the drag
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute inset-0 w-full h-full z-20 cursor-grab active:cursor-grabbing touch-pan-y"
      />
      
      {/* Overlapping images for smooth crossfade */}
      <AnimatePresence>
        <motion.img
          key={activeIndex}
          src={images[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none z-10", className)}
        />
      </AnimatePresence>

      {/* Visual Pagination Dots to indicate swipeability */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-[4px] z-30 pointer-events-none drop-shadow-md">
        {images.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === activeIndex 
                ? "w-3.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                : "w-1.5 bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

