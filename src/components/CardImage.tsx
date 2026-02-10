import React, { memo, useEffect, useMemo, useState } from 'react';
import { getCardImageUrl } from '@/utils/imageOptimization';
import PlaceholderImage from './PlaceholderImage';
import { imageCache } from '@/lib/swipe/cardImageCache';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

const CardImage = memo(({ src, alt, name }: { src?: string | null; alt?: string; name?: string }) => {
  const optimizedSrc = getCardImageUrl(src ?? '');
  // CRITICAL: re-check cache whenever `src` changes
  const wasInCache = useMemo(() => (src ? imageCache.has(src) : false), [src]);

  const [loaded, setLoaded] = useState<boolean>(() => !!(src && imageCache.has(src)));
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // reset error whenever src changes
    setError(false);

    // nothing to do for empty source
    if (!src) {
      setLoaded(false);
      return;
    }

    // don't run client image preloading during SSR
    if (!isBrowser()) return;

    // if cached, mark loaded immediately
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
      } catch (e) {
        // ignore decode errors
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
  }, [src, optimizedSrc]);

  if (!src || error) {
    return <PlaceholderImage name={name} />;
  }

  const transition = wasInCache ? 'none' : 'opacity 220ms ease';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '24px',
        zIndex: 1,
      }}
    >
      {/* Skeleton - shows while image is loading */}
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.2) 100%)',
            opacity: 1,
            transition: wasInCache ? 'none' : 'opacity 220ms ease',
          }}
        />
      )}

      <img
        src={optimizedSrc || src}
        alt={alt ?? ''}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition,
          borderRadius: '24px',
        }}
      />
    </div>
  );
});

export default CardImage;
