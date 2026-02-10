/**
 * Optimized Image Component
 * - Lazy loading by default
 * - Async decoding for smoother rendering
 * - Progressive loading with blur placeholder
 * - Error handling with fallback
 */

import { useState, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  priority?: boolean;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  showPlaceholder = true,
  priority = false,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imgSrc = hasError ? fallbackSrc : src;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder shimmer while loading */}
      {showPlaceholder && !isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/60"
          aria-hidden="true"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={imgSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        {...props}
      />
    </div>
  );
});

export default OptimizedImage;
