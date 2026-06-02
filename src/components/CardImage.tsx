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
  const mountedRef = useRef(true);
  const fallbackTriedRef = useRef(false);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    fallbackTriedRef.current = false;
    setErrored(false);
    const nextSrc = optimizedSrc || src || null;
    setImgSrc(nextSrc);

    if (!src) {
      setLoaded(false);
      return;
    }

    if (isMarketingSlide) {
      setLoaded(true);
      return;
    }

    if (cacheKey && imageCache.has(cacheKey)) {
      setLoaded(true);
      return;
    }

    setLoaded(false);

    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = priority ? 'high' : 'auto';
    img.onload = () => {
      if (!mountedRef.current) return;
      if (cacheKey) imageCache.set(cacheKey, true);
      setLoaded(true);
    };
    img.onerror = () => {
      if (!mountedRef.current) return;
    };
    img.src = cacheKey || '';
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, optimizedSrc, isMarketingSlide, cacheKey, priority]);

  const handleImgError = useCallback(() => {
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
  }, [imgSrc, src]);

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
          <motion.div 
            className="absolute inset-x-[-100%] inset-y-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative z-10 flex gap-1.5 opacity-40">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/50"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
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
          key={imgSrc}
          src={imgSrc}
          alt={alt ?? ''}
          data-swipe-card-image="true"
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
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
