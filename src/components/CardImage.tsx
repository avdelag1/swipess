import { memo, useEffect, useMemo, useState } from 'react';
import { getCardImageUrl, getBlurDataUrl } from '@/utils/imageOptimization';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { MarketingSlide } from './MarketingSlide';
import { SwipessLogo } from './SwipessLogo';
import { motion } from 'framer-motion';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

const CROSSFADE_MS = 100; // Accelerated crossfade for instant reaction
const _CROSSFADE_EASE = [0.4, 0, 0.2, 1]; // Smooth soft-start cubic bezier (reserved for future animation)

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
    
    // NATIVE PRE-CHECK: If browser already has it, don't flicker the blur
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
      {/* LQIP Placeholder with blur-up effect */}
      {/* 🚀 LIQUID GLASS SKELETON */}
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
            zIndex: 1,
          }}
        >
          {/* Moving Glass Flare */}
          <motion.div 
            className="absolute inset-x-[-100%] inset-y-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Branded Pulse */}
          <div className="relative z-10 flex flex-col items-center gap-4 opacity-20 scale-75 lg:scale-100">
            <SwipessLogo variant="white" size="sm" className="opacity-60" />
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/40"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
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

      <img
        src={displaySrc || optimizedSrc || src}
        alt={alt ?? ''}
        data-swipe-card-image="true"
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className="swipe-card-image"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        opacity: (loaded || wasInCache) ? 1 : 0,
        transition: (loaded && !wasInCache) ? `opacity ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
          borderRadius: br,
          zIndex: 3,
          transformOrigin: 'center',
          filter: loaded ? 'saturate(1.08) contrast(1.03)' : 'none',
          animation: (_animate && loaded) ? 'breathing-zoom 14s ease-in-out infinite alternate' : 'none',
          willChange: 'auto',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        onDragStart={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
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
    </div>
  );
});

export default CardImage;


