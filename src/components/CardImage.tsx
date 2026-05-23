import { memo, useEffect, useMemo, useState } from 'react';
import { getCardImageUrl, getBlurDataUrl } from '@/utils/imageOptimization';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { MarketingSlide } from './MarketingSlide';
import { motion, AnimatePresence } from 'framer-motion';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

const CROSSFADE_MS = 250; // Fade duration in ms for very smooth card/image transitions
const _CROSSFADE_EASE = [0.4, 0, 0.2, 1]; // Reserved for future animation

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
  const blurSrc = useMemo(() => (!isMarketingSlide && src ? getBlurDataUrl(src) : null), [src, isMarketingSlide]);
  const wasInCache = useMemo(() => (src && !isMarketingSlide ? imageCache.has(src) : false), [src, isMarketingSlide]);

  const [displaySrc, setDisplaySrc] = useState<string | null>(() => optimizedSrc || src || null);
  const [loaded, setLoaded] = useState<boolean>(() => {
    if (!src) return false;
    if (isMarketingSlide) return true;
    if (imageCache.has(src)) return true;
    if (isBrowser()) {
      const img = new Image();
      img.src = optimizedSrc || src;
      return img.complete;
    }
    return false;
  });
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
    setDisplaySrc(optimizedSrc || src || null);

    if (!src) {
      setLoaded(false);
      return;
    }

    if (isMarketingSlide) {
      setLoaded(true);
      return;
    }

    if (!isBrowser()) return;

    if (imageCache.has(src)) {
      setLoaded(true);
      return;
    }

    let mounted = true;
    const img = new Image();
    img.onload = async () => {
      if (!mounted) return;
      try {
        if ((img as any).decode) await (img as any).decode();
      } catch (_e) { /* decode not supported, skip */ }
      imageCache.set(src, true);
      setLoaded(true);
    };
    let triedOriginal = false;
    img.onerror = () => {
      if (!mounted) return;
      if (!triedOriginal && optimizedSrc && src && optimizedSrc !== src) {
        triedOriginal = true;
        setDisplaySrc(src);
        img.src = src;
        return;
      }
      setError(true);
    };
    img.src = optimizedSrc || src;
    return () => {
      mounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, optimizedSrc, isMarketingSlide]);

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

  // Main cross-fade: AnimatePresence ensures immediate fade in/out on card swap or photo transition.
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
      {/* LQIP Placeholder with blur-up effect, always shown if not loaded */}
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
              className="absolute inset-0 w-full h-full object-cover filter blur-[20px] scale-110 opacity-70 mix-blend-overlay transition-opacity duration-300"
            />
          )}
        </div>
      )}
      {/* Crossfade transition for main image (smoothed always) */}
      <AnimatePresence mode="wait" initial={false}>
        {(loaded || wasInCache) && displaySrc && (
          <motion.img
            key={displaySrc}
            src={displaySrc || optimizedSrc || src}
            alt={alt ?? ''}
            data-swipe-card-image="true"
            draggable={false}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : "auto"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSSFADE_MS / 1000, ease: _CROSSFADE_EASE }}
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
            }}
            onDragStart={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
            onLoad={() => {
              if (src) imageCache.set(src, true);
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
      </AnimatePresence>
    </div>
  );
});

export default CardImage;
