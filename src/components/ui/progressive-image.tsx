import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc?: string;
  alt: string;
}

export const ProgressiveImage = ({
  src,
  placeholderSrc,
  alt,
  className,
  ...props
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Low quality placeholder - visible until main image loads */}
      {!isLoaded && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-md scale-105"
        />
      )}
      {/* Main Image */}
      <img
        {...props}
        alt={alt}
        src={src}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          if (isLoaded) {
            // Memory purge, gently recover
            const target = e.target as HTMLImageElement;
            setTimeout(() => {
              if (target) target.src = src;
            }, 500);
          }
        }}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm scale-105'
        )}
      />
    </div>
  );
};

