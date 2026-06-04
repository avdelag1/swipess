import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBlurDataUrl, getCardImageUrl } from '@/utils/imageOptimization';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { MarketingSlide } from './MarketingSlide';
import { motion } from 'framer-motion';

const CROSSFADE_MS = 80;

const CardImage = memo(({
  src,
  alt,
  name,
  fallbackSrc,
  direction: _direction = 'right',
  fullScreen = false,
  animate: _animate = false,
  priority = false
}: {
  src?: string | null;
  alt?: string;
  name?: string;
  fallbackSrc?: string | null;
  direction?: 'left' | 'right';
  fullScreen?: boolean;
  animate?: boolean;
  priority?: boolean;
}) => {
  const isMarketingSlide = useMemo(() => src?.startsWith('marketing:'), [src]);
  const optimizedSrc = isMarketingSlide ? src : getCardImageUrl(src ?? '');
  const cacheKey = isMarketingSlide ? src : (optimizedSrc || src);
  const blurSrc = useMemo(() => (!isMarketingSlide && src ? getBlurDataUrl(src) : null), [src, isMarketingSlide]);

  const [imgSrc, setImgSrc] = useState<string | null>(() => optimizedSrc || src || null);
  const [loaded, setLoaded] = useState<boolean>(() => {
    if (!src) return false;
    if (isMarketingSlide) return true;
    if (cacheKey && imageCache.has(cacheKey)) return true;
    return false;
  });
  
  const [errored, setErrored] = useState<boolean>(false);
  const fallbackTriedRef = useRef(false);

  useEffect(() => {
    fallbackTriedRef.current = false;
    setErrored(false);
    
    if (!src) {
      setLoaded(false);
      setImgSrc(null);
      return;
    }

    if (isMarketingSlide) {
      setLoaded(true);
      return;
    }

    const nextSrc = optimizedSrc || src;
    setImgSrc(nextSrc);

    if (cacheKey && imageCache.has(cacheKey)) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src, optimizedSrc, isMarketingSlide, cacheKey]);

  const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (loaded) {
      // If it was already loaded and errors later, it's likely an iOS memory purge.
      // Do not set errored=true, preventing the image from unmounting.
      // We can try to soft-reload it to recover from the purge.
      const target = e.target as HTMLImageElement;
      setTimeout(() => {
        if (target && src) {
          target.src = optimizedSrc || src;
        }
      }, 500);
      return;
    }

    if (fallbackTriedRef.current) {
      setErrored(true);
      return;
    }
    
    fallbackTriedRef.current = true;
    if (imgSrc && src && imgSrc !== src) {
      setLoaded(false);
      setImgSrc(src);
      return;
    }
    setErrored(true);
  }, [imgSrc, src, loaded, optimizedSrc]);

  if (!src || errored) {
    if (fallbackSrc && fallbackSrc !== src) {
      return (
        <CardImage
          src={fallbackSrc}
          alt={alt}
          name={name}
          fullScreen={fullScreen}
          animate={_animate}
          priority={priority}
        />
      );
    }
    return <PlaceholderImage name={name} />;
  }

  if (isMarketingSlide) {
    return <MarketingSlide slideId={src} />;
  }

  const br = fullScreen ? 'inherit' : 'var(--radius-lg)';

  return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: br,
          zIndex: 1,
          contain: 'layout size style',
        }}
      >
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
            zIndex: 1,
          }}
        >
          {/* CSS-only Pulse Skeleton for massive performance gains over Framer Motion */}
          <div className="absolute inset-0 animate-pulse bg-white/5" />
          <div className="relative z-10 flex gap-2 opacity-60">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          {blurSrc && (
            <img
              src={blurSrc}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover filter blur-[20px] scale-110 opacity-70 mix-blend-overlay"
              style={{ touchAction: 'none', pointerEvents: 'none' }}
              onContextMenu={e => e.preventDefault()}
            />
          )}
        </div>
      )}
      {imgSrc && (
        <motion.img
          src={imgSrc}
          alt={alt ?? ''}
          data-swipe-card-image="true"
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          initial={false}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: CROSSFADE_MS / 1000 }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: br,
            zIndex: 3,
            willChange: 'opacity',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onDragStart={e => e.preventDefault()}
          onContextMenu={e => e.preventDefault()}
          onLoad={() => {
            if (cacheKey) imageCache.set(cacheKey, true);
            setLoaded(true);
          }}
          onError={handleImgError}
        />
      )}
    </div>
  );
});

export default CardImage;
