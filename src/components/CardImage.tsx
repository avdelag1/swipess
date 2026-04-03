import { memo, useEffect, useMemo, useState, useRef } from 'react';
import { getCardImageUrl, getBlurDataUrl } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { MarketingSlide } from './MarketingSlide';

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
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.2) 100%)',
            zIndex: 1,
          }}
        >
          {blurSrc && (
            <img
              src={blurSrc}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
                opacity: 0.6,
                transition: 'opacity 0.4s ease',
              }}
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
          opacity: loaded ? 1 : 0,
          transition: `opacity ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          borderRadius: br,
          zIndex: 3,
          transformOrigin: 'center',
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
