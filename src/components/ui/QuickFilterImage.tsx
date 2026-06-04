import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QuickFilterImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Image for quick filter cards.
 * Uses native loading mechanisms to prevent memory exhaustion on iOS Safari (PWA).
 */
export function QuickFilterImage({ src, alt, className }: QuickFilterImageProps) {
  const [isLoaded, setIsLoaded] = useState(() => {
    return typeof window !== 'undefined' && (window as any).__Swipess_cache?.[src];
  });
  const [hasError, setHasError] = useState(false);

  return (
    <>
      {/* Gradient placeholder / Fallback */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          hasError 
            ? "bg-slate-800 opacity-100" 
            : (isLoaded ? "opacity-0" : "bg-gradient-to-br from-muted via-muted/80 to-muted/60 opacity-100")
        )} 
      >
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
        )}
      </div>

      {/* Actual image */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-300",
          !isLoaded && !hasError ? "opacity-0" : "opacity-100"
        )}
      >
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
            if (typeof window !== 'undefined') {
              (window as any).__Swipess_cache = (window as any).__Swipess_cache || {};
              (window as any).__Swipess_cache[src] = true;
            }
          }}
          onError={(e) => {
            if (isLoaded) {
              // If it was already loaded, it might be an iOS Safari memory purge.
              // Try a soft reload after a tiny delay, or just let it sit.
              // We don't set hasError to true here so it doesn't turn into a gray box.
              const target = e.target as HTMLImageElement;
              setTimeout(() => {
                if (target) target.src = src;
              }, 250);
            } else {
              setHasError(true);
            }
          }}
          className={cn(
            "w-full h-full object-cover",
            className
          )}
        />
      </div>
    </>
  );
}


