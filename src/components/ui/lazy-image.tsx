import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /**
   * Enable blur-up effect with low-quality placeholder
   * Uses CSS filter transition for smooth effect
   */
  blurUp?: boolean;
  /**
   * Custom low-quality placeholder URL
   * If not provided, shows skeleton
   */
  placeholderSrc?: string;
}

/**
 * LazyImage - Production-ready optimized image component
 * 
 * Performance Features:
 * - Intersection Observer for lazy loading (200px rootMargin for early start)
 * - Smooth blur-to-clear transition using CSS filters
 * - Skeleton placeholder while loading
 * - Priority loading option for above-the-fold images
 * - Async decoding to keep main thread free
 * - AVIF/WebP support via srcset generation
 * - Proper sizing with width/height to prevent layout shift (CLS)
 * 
 * Core Web Vitals Optimizations:
 * - LCP: Use priority={true} for above-the-fold images
 * - CLS: Always provide width/height, use aspect-ratio CSS
 * - INP: async decoding keeps main thread responsive
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  width,
  height,
  priority = false,
  blurUp = false,
  placeholderSrc,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate srcset for responsive images with device pixel ratio support
  const generateSrcSet = (baseSrc: string): string => {
    // If already has srcset or query params, return as-is
    if (baseSrc.includes('?') || baseSrc.includes('srcset')) {
      return baseSrc;
    }
    
    // Generate width-based srcset
    const widths = [320, 480, 640, 768, 1024, 1280, 1536];
    return widths
      .map((w) => `${baseSrc}?width=${w}&q=80&fm=webp ${w}w`)
      .join(', ');
  };

  // Generate sizes attribute for responsive images
  const sizesAttr = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Calculate aspect-ratio to prevent CLS
  const aspectRatio = width && height ? `${width}/${height}` : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        placeholderClassName
      )}
      style={{ 
        width, 
        height,
        aspectRatio,
      }}
    >
      {/* Blur-up placeholder or skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {blurUp && placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-lg scale-105"
              aria-hidden="true"
            />
          ) : (
            <div className="absolute inset-0 skeleton skeleton-image" />
          )}
        </div>
      )}

      {/* Actual image - only render when in view */}
      {isInView && !hasError && (
        <picture>
          {/* AVIF - Best compression, modern browsers */}
          <source
            srcSet={src.includes('?') ? `${src}&fm=avif` : `${src}?fm=avif`}
            type="image/avif"
          />
          {/* WebP - Good compression, wide support */}
          <source
            srcSet={src.includes('?') ? `${src}&fm=webp` : `${src}?fm=webp`}
            type="image/webp"
          />
          <img
            ref={imgRef}
            src={src}
            srcSet={generateSrcSet(src)}
            sizes={sizesAttr}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'lazy-image w-full h-full object-cover transition-all duration-300',
              // Blur-up effect: blur → clear
              blurUp ? 'filter blur-0 scale-100' : 'opacity-0',
              isLoaded && 'opacity-100 blur-0 scale-100',
              !isLoaded && blurUp && 'blur-lg scale-105',
              className
            )}
            // Critical for CLS: force aspect-ratio before image loads
            style={{
              aspectRatio,
            }}
          />
        </picture>
      )}

      {/* Error state fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
});

export default LazyImage;

