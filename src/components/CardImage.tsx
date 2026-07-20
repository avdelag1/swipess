import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSrcSet, generatePictureSources, getBlurDataUrl, getCardImageUrl } from '@/utils/imageOptimization';
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
  layoutId?: string;
}) => {
  const isMarketingSlide = useMemo(() => src?.startsWith('marketing:'), [src]);
  const optimizedSrc = isMarketingSlide ? src : getCardImageUrl(src ?? '');
  const cacheKey = isMarketingSlide ? src : (optimizedSrc || src);
  const [imgSrc, setImgSrc] = useState<string | null>(() => optimizedSrc || src || null);

  const blurSrc = useMemo(() => (!isMarketingSlide && imgSrc ? getBlurDataUrl(imgSrc) : null), [imgSrc, isMarketingSlide]);
  const srcSet = useMemo(() => (!isMarketingSlide && imgSrc ? createSrcSet(imgSrc, 'webp') : ''), [imgSrc, isMarketingSlide]);
  const pictureSources = useMemo(() => (!isMarketingSlide && imgSrc ? generatePictureSources(imgSrc) : []), [imgSrc, isMarketingSlide]);

  const [loaded, setLoaded] = useState<boolean>(() => {
    if (!src) return false;
    if (isMarketingSlide) return true;
    if (cacheKey && imageCache.has(cacheKey)) return true;
    return false;
  });
  const [prevLoadedSrc, setPrevLoadedSrc] = useState<string | null>(null);

  const [errored, setErrored] = useState<boolean>(false);
  const fallbackTriedRef = useRef(false);

  // Preload the image a screen ahead of the viewport so it's already there as
  // you scroll instead of popping in. Priority, marketing, already-cached images
  // (and the swipe deck, which prewarms its own images) start in view; only
  // off-screen list/grid images wait for the observer.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState<boolean>(() => {
    if (priority || isMarketingSlide) return true;
    if (cacheKey && imageCache.has(cacheKey)) return true;
    return typeof IntersectionObserver === 'undefined';
  });

  useEffect(() => {
    if (isInView) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isInView]);

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
          layoutId={layoutId}
        />
      );
    }
    return <PlaceholderImage name={name} />;
  }

  if (isMarketingSlide) {
    return <MarketingSlide slideId={src} />;
  }

  const br = 'inherit';

  return (
      <motion.div
        ref={containerRef}
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
        layoutId={layoutId ? `${layoutId}-container` : undefined}
      >
      {!loaded && !prevLoadedSrc && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
            zIndex: 1,
          }}
        >
          <div className="absolute inset-0 animate-pulse bg-white/5" />
          <div className="relative z-10 flex gap-2 opacity-60">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          {blurSrc && isInView && (
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
      {!loaded && prevLoadedSrc && prevLoadedSrc !== imgSrc && (
        <img
          src={prevLoadedSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: br,
            zIndex: 2,
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'none',
          }}
          onContextMenu={e => e.preventDefault()}
        />
      )}
      {imgSrc && isInView && (
        <picture>
          {pictureSources.map((source, idx) => (
            <source
              key={idx}
              type={source.type}
              srcSet={source.srcSet}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            />
          ))}
          <motion.img
            src={imgSrc}
            srcSet={srcSet || undefined}
            sizes={srcSet ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px' : undefined}
            alt={alt ?? ''}
            data-swipe-card-image={_animate ? "true" : undefined}
            draggable={false}
            layoutId={layoutId}
            // Render is already gated by the IntersectionObserver above, so by the
            // time this mounts the image is near/in view — load it now rather than
            // deferring again to the browser's narrower native-lazy threshold.
            loading="eager"
            decoding="async"
            fetchpriority={priority ? "high" : "auto"}
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
              setPrevLoadedSrc(imgSrc);
              setLoaded(true);
            }}
            onError={handleImgError}
          />
        </picture>
      )}
    </motion.div>
  );
});

export default CardImage;
