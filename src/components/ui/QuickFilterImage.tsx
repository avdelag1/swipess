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
 * then slides in with the breathing animation already running.
 */
export function QuickFilterImage({ src, alt, className }: QuickFilterImageProps) {
  const [isReady, setIsReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;
    
    // Check if already cached by SpeedOfLightPreloader
    if ((window as any).__NEXUS DISCOVERY_cache?.[src]) {
      setIsReady(true);
      return;
    }

    const img = new Image();
    img.src = src;
    img.decode()
      .then(() => {
        setIsReady(true);
        (window as any).__NEXUS DISCOVERY_cache = (window as any).__NEXUS DISCOVERY_cache || {};
        (window as any).__NEXUS DISCOVERY_cache[src] = true;
      })
      .catch(() => {
        setIsReady(true);
      });
  }, [src]);

  return (
    <>
      {/* Gradient placeholder */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 transition-opacity duration-500",
          isReady ? "opacity-0" : "opacity-100"
        )} 
      />
      {/* Actual image — slides in after decode, breathing starts immediately */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          isReady ? "animate-photo-slide-in" : "opacity-0",
          className
        )}
        style={{ 
          animation: isReady 
            ? 'photo-slide-in 0.4s cubic-bezier(0.2,0,0,1) forwards, photo-swim 14s ease-in-out 0.4s infinite' 
            : 'none' 
        }}
      />
    </>
  );
}

