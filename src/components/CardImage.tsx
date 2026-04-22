import { memo, useEffect, useMemo, useState, useRef } from 'react';
import { getCardImageUrl, getBlurDataUrl } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';
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
  direction: _direction = 'right',
  fullScreen = false,
  animate: _animate = true,
  priority = false
}: { 
  src?: string | null; 
  alt?: string; 
  name?: string; 
  direction?: 'left' | 'right';
  fullScreen?: boolean;
  animate?: boolean;
  priority?: boolean;
}) => {
  const isMarketingSlide = useMemo(() => src?.startsWith('marketing:'), [src]);

  const optimizedSrc = isMarketingSlide ? src : getCardImageUrl(src ?? '');
  const blurSrc = useMemo(() => (!isMarketingSlide && src ? getBlurDataUrl(src) : null), [src, isMarketingSlide]);
  const wasInCache = useMemo(() => (src && !isMarketingSlide ? imageCache.has(src) : false), [src, isMarketingSlide]);

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

  const prevSrcRef = useRef<string | null | undefined>(null);
  const prevOptimizedRef = useRef<string | null>(null);
  const [showPrev, setShowPrev] = useState(false);

  useEffect(() => {
    setError(false);

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

    img.onerror = () => {
      if (!mounted) return;
      setError(true);
    };

    img.src = optimizedSrc || src;

    return () => {
      mounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, optimizedSrc, isMarketingSlide]);

  useEffect(() => {
    if (prevSrcRef.current && prevSrcRef.current !== src && wasInCache) {
      prevOptimizedRef.current = getCardImageUrl(prevSrcRef.current ?? '');
      setShowPrev(true);
      const timer = setTimeout(() => setShowPrev(false), CROSSFADE_MS + 50);
      prevSrcRef.current = src;
      return () => clearTimeout(timer);
    }
    prevSrcRef.current = src;
  }, [src, wasInCache]);

  if (!src || error) {
    return <PlaceholderImage name={name} />;
  }

  if (isMarketingSlide) {
    return <MarketingSlide slideId={src} />;
  }

  const br = fullScreen ? '0px' : '24px';

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
            <SwipessLogo variant="icon" className="w-12 h-12 grayscale" />
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
              className="absolute inset-0 w-full h-full object-cover filter blur-[20px] scale-110 opacity-40 mix-blend-overlay transition-opacity duration-300"
            />
          )}
        </div>
      )}

      {showPrev && prevOptimizedRef.current && (
        <img
          src={prevOptimizedRef.current}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: br,
            opacity: 0,
            animation: `photo-crossfade-out ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            zIndex: 2,
          }}
        />
      )}

      <img
        src={optimizedSrc || src}
        alt={alt ?? ''}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("")}
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
          animation: loaded ? 'photo-swim 12s ease-in-out infinite' : 'none',
          willChange: loaded ? 'transform' : 'auto',
        }}
        onLoad={() => {
          if (src) imageCache.set(src, true);
          setLoaded(true);
        }}
        onError={() => setError(true)}
      />
    </div>
  );
});

export default CardImage;


