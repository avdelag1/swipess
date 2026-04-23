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
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }
    
    setHasError(false);
    setIsReady(false);

    // Check if already cached by SpeedOfLightPreloader
    if ((window as any).__Swipess_cache?.[src]) {
      setIsReady(true);
      return;
    }

    const img = new Image();
    img.src = src;
    img.decode()
      .then(() => {
        setIsReady(true);
        (window as any).__Swipess_cache = (window as any).__Swipess_cache || {};
        (window as any).__Swipess_cache[src] = true;
      })
      .catch(() => {
        // Even if decode fails, we might still be able to show it
        // but we'll let the img tag's onError handle the actual "broken" state
        setIsReady(true);
      });
  }, [src]);

  return (
    <>
      {/* Gradient placeholder / Fallback */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          hasError 
            ? "bg-slate-800 opacity-100" 
            : (isReady ? "opacity-0" : "bg-gradient-to-br from-muted via-muted/80 to-muted/60 opacity-100")
        )} 
      >
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
        )}
      </div>

      {/* Actual image — slides in after decode, breathing starts immediately */}
      {!hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          onError={() => setHasError(true)}
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
      )}
    </>
  );
}


