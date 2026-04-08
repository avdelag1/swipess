import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface QuickFilterImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Progressive decode-first image for quick filter cards.
 * Shows a gradient placeholder, decodes the image off-thread,
 * then crossfades in with the breathing animation already running.
 */
export function QuickFilterImage({ src, alt, className }: QuickFilterImageProps) {
  const [isReady, setIsReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;
    
    // Check if already cached by SpeedOfLightPreloader
    if ((window as any).__swipess_cache?.[src]) {
      setIsReady(true);
      return;
    }

    const img = new Image();
    img.src = src;
    img.decode()
      .then(() => {
        setIsReady(true);
        (window as any).__swipess_cache = (window as any).__swipess_cache || {};
        (window as any).__swipess_cache[src] = true;
      })
      .catch(() => {
        // Fallback: show anyway
        setIsReady(true);
      });
  }, [src]);

  return (
    <>
      {/* Gradient placeholder — always visible underneath */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 transition-opacity duration-500",
          isReady ? "opacity-0" : "opacity-100"
        )} 
      />
      {/* Actual image — fades in after decode, breathing starts immediately */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
          isReady ? "opacity-100" : "opacity-0",
          className
        )}
        style={{ animation: isReady ? 'photo-swim 14s ease-in-out infinite' : 'none' }}
      />
    </>
  );
}
