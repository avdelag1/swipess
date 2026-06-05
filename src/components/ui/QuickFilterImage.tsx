import { cn } from '@/lib/utils';

interface QuickFilterImageProps {
  src: string | string[];
  alt: string;
  className?: string;
  animationDelay?: string;
}

/**
 * Image for quick filter cards.
 * Supports a pure CSS crossfade animation.
 */
export function QuickFilterImage({ src, alt, className, animationDelay = '0s' }: QuickFilterImageProps) {
  const images = Array.isArray(src) ? src : [src];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900/50">
      {images.map((imgSrc, index) => {
        // We apply the crossfade animation if the array has > 1 image
        const inlineStyle = images.length > 1 ? { 
          animation: `crossfade-${index + 1} 12s infinite`,
          animationDelay 
        } : {};

        return (
          <img
            key={`${imgSrc}-${index}`}
            src={imgSrc}
            alt={`${alt} ${index + 1}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={inlineStyle}
            className={cn(
              "absolute inset-0 w-full h-full object-cover",
              className
            )}
          />
        );
      })}
    </div>
  );
}

