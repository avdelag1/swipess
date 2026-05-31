import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { getBlurDataUrl, getCardImageUrl } from '@/utils/imageOptimization';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { MarketingSlide } from './MarketingSlide';
import { motion } from 'framer-motion';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

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

  const [displaySrc, setDisplaySrc] = useState<string | null>(() => optimizedSrc || src || null);
  const [loaded, setLoaded] = useState<boolean>(() => {
    if (!src) return false;
    if (isMarketingSlide) return true;
    if (cacheKey && imageCache.has(cacheKey)) return true;
    if (isBrowser()) {
      const img = new Image();
      img.src = cacheKey || '';
      return img.complete;
    }
    return false;
  });
  const [error, setError] = useState<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setError(false);
    const nextSrc = optimizedSrc || src || null;
    setDisplaySrc(nextSrc);

    if (!src) {
      setLoaded(false);
      return;
    }

    if (isMarketingSlide) {
      setLoaded(true);
      return;
    }

    if (!isBrowser()) return;

    if (cacheKey && imageCache.has(cacheKey)) {
      setLoaded(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (!mountedRef.current) return;
      if (cacheKey) imageCache.set(cacheKey, true);
      setLoaded(true);
    };
    let triedOriginal = false;
    img.onerror = () => {
      if (!mountedRef.current) return;
      if (!triedOriginal && optimizedSrc && src && optimizedSrc !== src) {
        triedOriginal = true;
        setDisplaySrc(src);
        img.src = src;
        return;
      }
      setError(true);
    };
    img.src = cacheKey || '';
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, optimizedSrc, isMarketingSlide, cacheKey]);

  if (!src || error) {
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
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden transition-opacity duration-150"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
          zIndex: 1,
          opacity: loaded ? 0 : 1,
          pointerEvents: loaded ? 'none' : 'auto',
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
            className="absolute inset-0 w-full h-full object-cover filter blur-[20px] scale-110 opacity-70 mix-blend-overlay transition-opacity duration-300"
            style={{ touchAction: 'none', pointerEvents: 'none' }}
            onContextMenu={e => e.preventDefault()}
          />
        )}
      </div>
      {displaySrc && (
        <motion.img
          key={displaySrc}
          src={displaySrc}
          alt={alt ?? ''}
          data-swipe-card-image="true"
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          initial={false}
          animate={{ opacity: 1 }}
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
          onError={() => {
            if (displaySrc && src && displaySrc !== src) {
              setLoaded(false);
              setDisplaySrc(src);
              return;
            }
            setError(true);
          }}
        />
      )}
    </div>
  );
});

export default CardImage;
