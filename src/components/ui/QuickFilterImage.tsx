import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface QuickFilterImageProps {
  src: string | string[];
  alt: string;
  className?: string;
  animationDelay?: string;
}

/**
 * Image for quick filter cards.
 * Supports native CSS scroll snapping and auto-rotation.
 */
export function QuickFilterImage({ src, alt, className, animationDelay = '0s' }: QuickFilterImageProps) {
  const images = Array.isArray(src) ? src : [src];
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIndex = useRef(0);

  useEffect(() => {
    if (images.length <= 1) return;

    // The user requested EXACT synchronized cascading order: Properties (0s) -> Bicycles (1s) -> Motorcycles (2s)
    // with each card taking exactly 5 seconds before it moves again.
    const delayS = parseFloat(animationDelay.replace('s', '')) || 0;
    const baseInterval = 5000; // Exact 5 seconds between rotations for a single card
    const exactOffset = delayS * 1000;

    let timeoutId: ReturnType<typeof setTimeout>;

    const rotate = () => {
      if (!scrollRef.current) return;
      scrollIndex.current = (scrollIndex.current + 1) % images.length;
      
      const targetElement = scrollRef.current.children[scrollIndex.current] as HTMLElement;
      if (targetElement) {
        scrollRef.current.scrollTo({
          left: targetElement.offsetLeft,
          behavior: 'smooth'
        });
      }
      
      timeoutId = setTimeout(rotate, baseInterval);
    };

    // Start the first rotation at the exact staggered offset.
    timeoutId = setTimeout(rotate, baseInterval + exactOffset);

    return () => clearTimeout(timeoutId);
  }, [images.length, animationDelay]);

  if (images.length === 1) {
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
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50 pointer-events-auto">
      <div 
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar pointer-events-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((imgSrc, index) => (
          <div key={`${imgSrc}-${index}`} className="flex-none w-full h-full snap-center relative">
            <img
              src={imgSrc}
              alt={`${alt} ${index + 1}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none", className)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

