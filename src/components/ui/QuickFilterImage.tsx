import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface QuickFilterImageProps {
  src: string | string[];
  alt: string;
  className?: string;
}

/**
 * Image for quick filter cards.
 * Supports a pure CSS crossfade carousel if an array of 3 strings is passed.
 */
export function QuickFilterImage({ src, alt, className }: QuickFilterImageProps) {
  const images = Array.isArray(src) ? src : [src];
  const [loadedStates, setLoadedStates] = useState<boolean[]>(images.map(() => false));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLoadedStates(images.map((s) => {
      return typeof window !== 'undefined' && !!(window as any).__Swipess_cache?.[s];
    }));
  }, [src]);

  // If any single image is loaded, we consider it "ready" to show something
  const anyLoaded = loadedStates.some(Boolean);

  return (
    <>
      {/* Gradient placeholder / Fallback */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          hasError 
            ? "bg-slate-800 opacity-100" 
            : (anyLoaded ? "opacity-0" : "bg-gradient-to-br from-muted via-muted/80 to-muted/60 opacity-100")
        )} 
      >
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
        )}
      </div>

      {/* Actual images container - NEVER HIDDEN, individual images fade in! */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {images.map((imgSrc, index) => {
          const isLoaded = loadedStates[index];
          // We only apply the crossfade animation if the array has > 1 image AND the image has loaded
          const inlineStyle = (images.length > 1 && isLoaded) ? { animation: `crossfade-${index + 1} 12s infinite` } : {};

          return (
            <img
              key={`${imgSrc}-${index}`}
              src={imgSrc}
              alt={`${alt} ${index + 1}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              style={inlineStyle}
              onLoad={() => {
                setLoadedStates(prev => {
                  const next = [...prev];
                  next[index] = true;
                  return next;
                });
                setHasError(false);
                if (typeof window !== 'undefined') {
                  (window as any).__Swipess_cache = (window as any).__Swipess_cache || {};
                  (window as any).__Swipess_cache[imgSrc] = true;
                }
              }}
              onError={(e) => {
                if (loadedStates[index]) {
                  const target = e.target as HTMLImageElement;
                  setTimeout(() => {
                    if (target) target.src = imgSrc;
                  }, 250);
                } else {
                  setHasError(true);
                }
              }}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
                !isLoaded ? "opacity-0" : (images.length > 1 ? "opacity-0" : "opacity-100"), // Start at 0 if animating, keyframes handle it once applied via style
                className
              )}
            />
          );
        })}
      </div>
    </>
  );
}

