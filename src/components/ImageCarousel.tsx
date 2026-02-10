import { useState, useCallback, useEffect, memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
  className?: string;
  showThumbnails?: boolean;
}

// LRU Cache implementation for image caching - INSTANT RESPONSE
const MAX_CACHE_SIZE = 150;
const globalImageCache = new Map<string, { loaded: boolean; decoded: boolean; lastAccessed: number; element?: HTMLImageElement }>();

// Add LRU eviction when cache is full
function evictLRUIfNeeded() {
  if (globalImageCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of globalImageCache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      globalImageCache.delete(oldestKey);
    }
  }
}

// Update cache access time
function updateCacheAccess(url: string) {
  const cached = globalImageCache.get(url);
  if (cached) {
    cached.lastAccessed = Date.now();
  }
}

// High-priority preload for immediate adjacent images
const preloadingUrls = new Set<string>();

function preloadImageImmediate(url: string): void {
  if (preloadingUrls.has(url) || globalImageCache.get(url)?.decoded) return;
  preloadingUrls.add(url);

  const img = new Image();
  img.decoding = 'async';
  (img as any).fetchPriority = 'high';

  img.onload = () => {
    preloadingUrls.delete(url);
    evictLRUIfNeeded();

    // Decode immediately for instant display
    if ('decode' in img) {
      img.decode().then(() => {
        globalImageCache.set(url, {
          loaded: true,
          decoded: true,
          lastAccessed: Date.now(),
          element: img
        });
      }).catch(() => {
        globalImageCache.set(url, { loaded: true, decoded: true, lastAccessed: Date.now() });
      });
    } else {
      globalImageCache.set(url, { loaded: true, decoded: true, lastAccessed: Date.now() });
    }
  };

  img.onerror = () => {
    preloadingUrls.delete(url);
  };

  img.src = url;
}

// Background preload for non-adjacent images
function preloadImageBackground(url: string): void {
  if (preloadingUrls.has(url) || globalImageCache.has(url)) return;
  preloadingUrls.add(url);

  const preload = () => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      preloadingUrls.delete(url);
      evictLRUIfNeeded();
      globalImageCache.set(url, { loaded: true, decoded: false, lastAccessed: Date.now() });
      if ('decode' in img) {
        img.decode().then(() => {
          const cached = globalImageCache.get(url);
          if (cached) {
            cached.decoded = true;
            cached.element = img;
            cached.lastAccessed = Date.now();
          }
        }).catch(() => {});
      }
    };
    img.onerror = () => {
      preloadingUrls.delete(url);
    };
    img.src = url;
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload, { timeout: 1000 });
  } else {
    setTimeout(preload, 50);
  }
}

// INSTANT decode - returns immediately if cached, otherwise decodes fast
async function decodeImageFastFast(src: string): Promise<boolean> {
  const cached = globalImageCache.get(src);
  if (cached?.decoded) {
    updateCacheAccess(src);
    return true;
  }

  return new Promise((resolve) => {
    const img = new Image();
    (img as any).fetchPriority = 'high';
    img.decoding = 'sync'; // Synchronous for faster response
    img.src = src;

    img.onload = () => {
      evictLRUIfNeeded();
      globalImageCache.set(src, { loaded: true, decoded: true, lastAccessed: Date.now(), element: img });
      resolve(true);
    };
    img.onerror = () => resolve(false);
  });
}

const ImageCarouselComponent = ({
  images,
  alt,
  aspectRatio = '4:3',
  className,
  showThumbnails = true
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // PERF FIX: Check cache SYNCHRONOUSLY on init to prevent black flash
  // If first image is already cached+decoded, show it immediately (no transition)
  const getInitialImageState = () => {
    const firstSrc = images?.[0];
    if (!firstSrc) return { displayedSrc: null, showImage: false };

    const cached = globalImageCache.get(firstSrc);
    if (cached?.decoded) {
      // Image is cached and decoded - show immediately, skip all transitions
      return { displayedSrc: firstSrc, showImage: true };
    }
    return { displayedSrc: null, showImage: false };
  };

  const initialState = getInitialImageState();

  // Two-layer approach: previous image stays visible while next decodes
  const [displayedSrc, setDisplayedSrc] = useState<string | null>(initialState.displayedSrc);
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasError, setHasError] = useState(false);
  // PERF FIX: Track if we started with a cached image to skip fade animation
  const [showImage, setShowImage] = useState(initialState.showImage);
  const startedCachedRef = useRef(initialState.showImage);

  const containerRef = useRef<HTMLDivElement>(null);
  const decodingRef = useRef<boolean>(false);

  // Get current image source
  const currentImageSrc = images?.[currentIndex] || null;

  // CORE FIX: Two-layer image transition - never show empty/black
  // Previous image stays visible until new image is fully decoded
  useEffect(() => {
    if (!currentImageSrc) return;
    if (decodingRef.current) return; // Prevent race conditions

    // Check if already cached and decoded
    const cached = globalImageCache.get(currentImageSrc);
    if (cached?.decoded && displayedSrc !== currentImageSrc) {
      // INSTANT switch for cached+decoded images - no delay
      updateCacheAccess(currentImageSrc);
      setPreviousSrc(displayedSrc);
      setDisplayedSrc(currentImageSrc);
      setShowImage(true);
      setIsTransitioning(true);
      // Clear previous immediately for cached images
      requestAnimationFrame(() => {
        setIsTransitioning(false);
        setPreviousSrc(null);
      });
      return;
    }

    // If first load (no displayedSrc yet), show immediately and decode
    if (!displayedSrc) {
      setDisplayedSrc(currentImageSrc);
      decodeImageFastFast(currentImageSrc).then((success) => {
        if (success) {
          evictLRUIfNeeded();
          globalImageCache.set(currentImageSrc, { loaded: true, decoded: true, lastAccessed: Date.now() });
          setShowImage(true);
        }
      });
      return;
    }

    // New image needs decoding - keep previous visible during decode
    if (displayedSrc !== currentImageSrc) {
      decodingRef.current = true;
      setPreviousSrc(displayedSrc);
      setIsTransitioning(true);

      decodeImageFastFast(currentImageSrc).then((success) => {
        decodingRef.current = false;
        if (success) {
          evictLRUIfNeeded();
          globalImageCache.set(currentImageSrc, { loaded: true, decoded: true, lastAccessed: Date.now() });
          setDisplayedSrc(currentImageSrc);
          setShowImage(true);
          setHasError(false);
        } else {
          setHasError(true);
          // Still show the image even if decode failed
          setDisplayedSrc(currentImageSrc);
          setShowImage(true);
        }
        // FAST transition then clear previous
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousSrc(null);
        }, 80);
      });
    }
  }, [currentImageSrc, displayedSrc]);

  // INSTANT: Preload adjacent images immediately when index changes
  useEffect(() => {
    if (!images || images.length === 0) return;

    // HIGH PRIORITY: Next and previous images - preload immediately
    const nextIdx = (currentIndex + 1) % images.length;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;

    if (images[nextIdx]) preloadImageImmediate(images[nextIdx]);
    if (images[prevIdx]) preloadImageImmediate(images[prevIdx]);

    // BACKGROUND: Preload 2 ahead and 2 behind
    const bgIndices = [
      (currentIndex + 2) % images.length,
      (currentIndex - 2 + images.length) % images.length,
    ];
    bgIndices.forEach(idx => {
      if (images[idx]) preloadImageBackground(images[idx]);
    });
  }, [currentIndex, images]);

  // These hooks must be defined before any early returns to follow Rules of Hooks
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? (images?.length || 1) - 1 : prev - 1));
  }, [images?.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === (images?.length || 1) - 1 ? 0 : prev + 1));
  }, [images?.length]);

  // INSTANT TAP RESPONSE - no delay
  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in event
      ? event.touches[0]?.clientX ?? event.changedTouches[0]?.clientX ?? 0
      : (event as React.MouseEvent).clientX;
    const clickX = clientX - rect.left;
    const imageWidth = rect.width;

    // Left 35% = previous, Right 35% = next (larger tap zones)
    if (clickX < imageWidth * 0.35) {
      goToPrevious();
    } else if (clickX > imageWidth * 0.65) {
      goToNext();
    }
  }, [goToPrevious, goToNext]);

  if (!images || images.length === 0) {
    return (
      <div className={cn(
        "w-full bg-muted/20 rounded-lg flex items-center justify-center",
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === '4:3' && 'aspect-[4/3]',
        aspectRatio === '16:9' && 'aspect-video',
        aspectRatio === 'auto' && 'h-64',
        className
      )}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const aspectRatioClass = cn(
    aspectRatio === 'square' && 'aspect-square',
    aspectRatio === '4:3' && 'aspect-[4/3]',
    aspectRatio === '16:9' && 'aspect-video',
    aspectRatio === 'auto' && 'h-full'
  );

  return (
    <div className={cn("relative w-full h-full", className)} ref={containerRef}>
      {/* Main Image Container - GPU accelerated for instant response */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg cursor-pointer group touch-manipulation",
          aspectRatioClass
        )}
        onClick={handleImageClick}
        onTouchEnd={handleImageClick}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* LAYER 1: Neutral blur placeholder - always visible as base
            Uses a light neutral gradient instead of dark/black */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
          style={{ zIndex: 1 }}
        />

        {/* LAYER 2: Blurred version of current image (if available) as enhanced placeholder */}
        {displayedSrc && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              zIndex: 2,
              filter: 'blur(20px)',
              transform: 'scale(1.1)',
            }}
          >
            <img
              src={displayedSrc}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              aria-hidden="true"
            />
          </div>
        )}

        {/* LAYER 3: Previous image - stays visible during transition */}
        {previousSrc && isTransitioning && (
          <img
            src={previousSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              zIndex: 3,
              opacity: 1,
            }}
            aria-hidden="true"
          />
        )}

        {/* LAYER 4: Current image - INSTANT display for cached images */}
        {displayedSrc && (
          <img
            src={displayedSrc}
            alt={`${alt} ${currentIndex + 1}`}
            className={`absolute inset-0 w-full h-full object-cover ${
              startedCachedRef.current ? '' : 'transition-opacity duration-100'
            }`}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            style={{
              zIndex: 4,
              opacity: showImage && !(isTransitioning && previousSrc) ? 1 : 0,
              transform: 'translateZ(0)',
              willChange: 'opacity',
              backfaceVisibility: 'hidden',
            }}
            onLoad={() => {
              if (!showImage) {
                setShowImage(true);
                // After first load, allow transitions for subsequent images
                startedCachedRef.current = false;
              }
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
              setHasError(true);
              setShowImage(true);
            }}
          />
        )}

        {/* Click Areas - Visual hints on hover (desktop only) - matches 35% tap zones */}
        {images.length > 1 && (
          <>
            <div
              className="absolute left-0 top-0 w-[35%] h-full bg-gradient-to-r from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-start pl-4 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <div
              className="absolute right-0 top-0 w-[35%] h-full bg-gradient-to-l from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-end pr-4 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </>
        )}

        {/* Navigation Buttons (desktop) */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ zIndex: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ zIndex: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-sm backdrop-blur-sm"
            style={{ zIndex: 12 }}
          >
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Progress dots (mobile-friendly) */}
        {images.length > 1 && images.length <= 10 && (
          <div
            className="absolute top-2 left-0 right-0 flex justify-center gap-1 px-4"
            style={{ zIndex: 12 }}
          >
            {images.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all duration-200 max-w-8",
                  idx === currentIndex
                    ? 'bg-white'
                    : 'bg-white/40'
                )}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={`thumb-${image}-${index}`}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-all duration-200",
                index === currentIndex
                  ? 'border-primary scale-105'
                  : 'border-transparent hover:border-primary/50'
              )}
            >
              <img
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ImageCarousel = memo(ImageCarouselComponent);
