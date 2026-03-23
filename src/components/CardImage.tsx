import { memo, useEffect, useMemo, useState, useRef } from 'react';
import { getCardImageUrl } from '@/utils/imageOptimization';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { MarketingSlide } from './MarketingSlide';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

const CROSSFADE_MS = 200;

const CardImage = memo(({ 
  src, 
  alt, 
  name, 
  _direction = 'right',
  fullScreen = false 
}: { 
  src?: string | null; 
  alt?: string; 
  name?: string; 
  direction?: 'left' | 'right';
  fullScreen?: boolean;
}) => {
  const isMarketingSlide = useMemo(() => src?.startsWith('marketing:'), [src]);

  const optimizedSrc = isMarketingSlide ? src : getCardImageUrl(src ?? '');
  const wasInCache = useMemo(() => (src && !isMarketingSlide ? imageCache.has(src) : false), [src, isMarketingSlide]);

  const [loaded, setLoaded] = useState<boolean>(() => !!(src && (isMarketingSlide || imageCache.has(src))));
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
      } catch (_e) { // no-op
      }
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
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.2) 100%)',
            opacity: 1,
            transition: wasInCache ? 'none' : 'opacity 400ms ease',
          }}
        />
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
        key={src}
        src={optimizedSrc || src}
        alt={alt ?? ''}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: wasInCache ? 'none' : `opacity ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          borderRadius: br,
          animation: wasInCache
            ? `photo-crossfade-in ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards, breathing-zoom 8s ease-out infinite alternate`
            : 'breathing-zoom 8s ease-out infinite alternate',
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
