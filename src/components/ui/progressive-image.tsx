import { useState, useEffect } from 'react';
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
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <img
      {...props}
      alt={alt}
      src={imgSrc}
      className={cn(
        'transition-all duration-100',
        isLoaded ? 'progressive-image' : 'blur-sm',
        className
      )}
    />
  );
};
