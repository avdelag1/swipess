import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  EXIT_SPRING,
  PK_DIST_THRESHOLD,
  PK_SPRING,
  PK_VEL_THRESHOLD,
  POKER_CARD_GRADIENTS,
  POKER_CARD_PHOTOS,
  PokerCardData,
} from './SwipeConstants';
import { getCategoryPhotoList, useCategoryPhotos } from '@/hooks/useCategoryPhotos';
import { cn } from '@/lib/utils';
import { imageCache } from '@/lib/swipe/cardImageCache';

interface PokerCardProps {
  card: PokerCardData;
  index: number;
  total: number;
  isTop: boolean;
  isCollapsed?: boolean;
  onCycle: (id: string, direction: 'left' | 'right') => void;
  onSelect: (id: string) => void;
  onBringToFront: (index: number) => void;
  cardHeight?: number;
}

// Module-level cache so re-mounts (cycling through deck) don't re-flash imgReady=false
const _loadedPokerImages = new Set<string>();
// Track which photo was last set per-card key to avoid stale useEffect races
const _lastPhotoKey = new Map<string, string>();

// Detect low-end / reduced-motion devices once at module load.
const _isLowEndDevice = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lowMem = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
    return Boolean(reducedMotion || lowMem);
  } catch { return false; }
})();

export const PokerCategoryCard = memo(({ card, index, isTop, isCollapsed: _isCollapsed = false, onCycle, onSelect, onBringToFront }: PokerCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Use a REF for drag state — synchronous, never stale inside onTap.
  const isDraggingRef = useRef(false);
  // Ref to track if a commit exit animation is in progress (prevent re-trigger)
  const isExitingRef = useRef(false);
  const engageButtonRef = useRef<HTMLButtonElement>(null);

  // Keep a visual "isDragging" state just for cursor styling.
  const [isDraggingVisual, setIsDraggingVisual] = useState(false);

  // Subtle fade as the card moves off — no rotation.
  const exitOpacity = useTransform(
    [x, y] as any,
    ([cx, cy]: any) => {
      const a = Math.min(1, Math.abs(cx) / 260);
      const b = Math.min(1, Math.abs(cy) / 260);
      return 1 - Math.max(a, b) * 0.35;
    }
  );
  // Faint breathing hints — visible only while idle on the top card.
  const hintOpacity = useTransform(
    [x, y] as any,
    ([cx, cy]: any) => (Math.abs(cx) + Math.abs(cy) > 4 ? 0 : 1)
  );

  // Build the carousel pool: base poster + admin-managed extras.
  const { data: extraPhotos } = useCategoryPhotos();
  const photoList = useMemo(
    () => getCategoryPhotoList(card.id, extraPhotos),
    [card.id, extraPhotos],
  );
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photoList[photoIndex] || POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
  const fallbackGradient = useMemo(() => {
    return POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  }, [card.id]);
  const cardKey = card.id;

  const [imgReady, setImgReady] = useState(() => {
    return imageCache.has(photo) || _loadedPokerImages.has(photo);
  });

  // Store previous photo for smooth crossfade
  const [prevPhoto, setPrevPhoto] = useState<string | null>(null);
  const prevPhotoRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPhotoRef.current && prevPhotoRef.current !== photo) {
      setPrevPhoto(prevPhotoRef.current);
    }
    prevPhotoRef.current = photo;
  }, [photo]);

  useLayoutEffect(() => {
    const prev = _lastPhotoKey.get(cardKey);
    _lastPhotoKey.set(cardKey, photo);
    if (prev === photo) return;

    if (imageCache.has(photo) || _loadedPokerImages.has(photo)) {
      setImgReady(true);
      return;
    }

    setImgReady(false);
    const img = new Image();
    img.onload = () => {
      _loadedPokerImages.add(photo);
      imageCache.set(photo, true);
      setImgReady(true);
    };
    img.onerror = () => setImgReady(false);
    img.src = photo;
  }, [photo, cardKey]);

  // Preload all carousel photos.
  useEffect(() => {
    photoList.forEach((src) => {
      if (imageCache.has(src) || _loadedPokerImages.has(src)) return;
      const im = new Image();
      im.onload = () => {
        imageCache.set(src, true);
        _loadedPokerImages.add(src);
      };
      im.src = src;
    });
  }, [photoList]);

  // Carousel: start ~5s in, then advance every 5–10s. Only top card animates.
  useEffect(() => {
    if (!isTop || photoList.length < 2) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setPhotoIndex((i) => (i + 1) % photoList.length);
      const next = 5000 + Math.random() * 5000;
      timerId = window.setTimeout(tick, next);
    };
    let timerId = window.setTimeout(tick, 5000);
    return () => { cancelled = true; clearTimeout(timerId); };
  }, [isTop, card.id, photoList.length]);

  // Reset to first photo when this card returns to the top.
  useEffect(() => {
    if (isTop) setPhotoIndex(0);
  }, [isTop, card.id]);

  // Reset drag state when card becomes top.
  useEffect(() => {
    if (!isTop) return;
    x.stop();
    y.stop();
    x.set(0);
    y.set(0);
    isDraggingRef.current = false;
    isExitingRef.current = false;
    setIsDraggingVisual(false);
  }, [card.id, isTop, x, y]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    // If already animating exit, ignore.
    if (isExitingRef.current) return;

    isDraggingRef.current = false;
    setIsDraggingVisual(false);

    const dx = info.offset.x;
    const vx = info.velocity.x;
    const commitX = Math.abs(dx) > PK_DIST_THRESHOLD || Math.abs(vx) > PK_VEL_THRESHOLD;

    if (commitX) {
      isExitingRef.current = true;
      triggerHaptic('light');
      const direction = dx > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 520 : -520;
      animate(x, exitX, {
        ...EXIT_SPRING,
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0);
          isExitingRef.current = false;
        }
      });
      return;
    }

    // Snap back.
    animate(x, 0, { ...PK_SPRING });
  }, [card.id, onCycle, x]);

  // Stack styling — no blur (avoids expensive repaints), just brightness falloff
  const { stackOpacity, stackedFilter } = useMemo(() => ({
    stackOpacity: 1,
    stackedFilter: isTop
      ? 'brightness(0.98)'
      : `brightness(${0.96 - index * 0.045})`,
  }), [index, isTop]);

  if (index > 7) return null;

  return (
    <motion.div
      // Only the top card is draggable. No constraints — let the card move
      // freely so the exit animate() to ±520 isn't fought by constraint springs.
      drag={isTop ? 'x' : false}
      dragMomentum={false}
      dragElastic={0.8}
      onDragStart={() => {
        if (isExitingRef.current) return;
        isDraggingRef.current = true;
        setIsDraggingVisual(true);
        triggerHaptic('light');
      }}
      onDragEnd={handleDragEnd}
      onTap={(e: any) => {
        // Synchronous ref guard — never stale.
        if (isDraggingRef.current || isExitingRef.current) return;
        // Ignore micro-drags (finger slid slightly).
        if (Math.abs(x.get()) >= 8) return;

        if (!isTop) {
          triggerHaptic('light');
          onBringToFront(index);
          return;
        }

        // If the tap landed inside the Engage button, let the button's
        // own onClick handle it — don't double-fire.
        if (engageButtonRef.current?.contains(e?.target as Node)) return;

        triggerHaptic('medium');
        onSelect(card.id);
      }}
      initial={false}
      animate={{}}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        x: isTop ? x : 0,
        y: 0,
        zIndex: 100 - index,
        opacity: isTop ? exitOpacity : stackOpacity,
        scale: 1,
        filter: stackedFilter,
        cursor: isTop ? (isDraggingVisual ? 'grabbing' : 'grab') : 'pointer',
        touchAction: 'pan-y',
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      } as any}
      transition={{ ...PK_SPRING }}
      className="select-none"
    >
      <div
        className="w-full h-full relative overflow-hidden bg-black rounded-[2.5rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]"
        style={{ backgroundImage: fallbackGradient }}
      >
        {/* Photo carousel — smooth crossfade: both old and new render simultaneously */}
        <div className="absolute inset-0">
          {/* Previous photo fading out */}
          {prevPhoto && prevPhoto !== photo && (
            <motion.img
              key={`old-${prevPhoto}`}
              src={prevPhoto}
              alt=""
              aria-hidden
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              onAnimationComplete={() => setPrevPhoto(null)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ backfaceVisibility: 'hidden' }}
              draggable={false}
            />
          )}
          {/* Current photo fading in */}
          <motion.img
            key={photo}
            src={photo}
            alt={card.label}
            loading="eager"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: imgReady ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ backfaceVisibility: 'hidden', willChange: 'opacity' }}
            draggable={false}
          />
        </div>

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Breathing swipe-hint dots — top card only, capable devices only */}
        {isTop && !_isLowEndDevice && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{ opacity: hintOpacity }}
          >
            <div className="absolute top-1/2 left-3 -translate-y-1/2 w-1 h-8 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.4s' }} />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 w-1 h-8 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.4s' }} />
            <div className="absolute left-1/2 top-3 -translate-x-1/2 w-8 h-1 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '2.6s' }} />
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-8 h-1 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '2.6s' }} />
          </motion.div>
        )}

        {/* Card content */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-9 md:p-11 gap-8">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-[1px] shadow-[0_0_8px_rgba(255,255,255,0.4)] bg-white/40" />
              <span
                className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white"
                style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
              >
                {card.description}
              </span>
            </motion.div>

            <h3
              className={cn(
                'font-black tracking-[calc(-0.06em)] leading-[0.85] uppercase italic text-white force-white',
                card.label.length <= 8 ? 'text-5xl' : card.label.length <= 10 ? 'text-4xl' : 'text-3xl'
              )}
              style={{
                color: '#FFFFFF',
                textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7)',
              }}
            >
              {card.label}
            </h3>
          </div>

          {isTop && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 20 }}
            >
              <button
                type="button"
                ref={engageButtonRef}
                // Stop pointer capture so the drag gesture on the card body
                // isn't accidentally stolen when the finger lands on the button.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDraggingRef.current || isExitingRef.current) return;
                  triggerHaptic('medium');
                  onSelect(card.id);
                }}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-widest transition-all hover:scale-[1.02] active:scale-95 text-black shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/40"
                style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)' }}
                aria-label="Engage Discovery"
              >
                {card.icon && <card.icon className="w-5 h-5" />}
                <span>Engage Discovery</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
