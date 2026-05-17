import { memo, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import useAppTheme from '@/hooks/useAppTheme';
import { AnimatePresence, motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { toggleChrome } from '@/hooks/useChromeReveal';
import {
  POKER_CARD_PHOTOS,
  POKER_CARD_GRADIENTS,
  PokerCardData,
  PK_DIST_THRESHOLD,
  PK_VEL_THRESHOLD,
  PK_SPRING,
} from './SwipeConstants';
import { useCategoryPhotos, getCategoryPhotoList } from '@/hooks/useCategoryPhotos';
import { cn } from '@/lib/utils';

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

// Detect low-end / reduced-motion devices once at module load.
// Blur + continuous scale across multiple stacked cards is the single
// biggest GPU cost on Android. Disable both on weak hardware.
const _isLowEndDevice = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lowMem = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
    return Boolean(reducedMotion || lowMem);
  } catch { return false; }
})();

export const PokerCategoryCard = memo(({ card, index, isTop, isCollapsed = false, onCycle, onSelect, onBringToFront }: PokerCardProps) => {
  const { theme } = useAppTheme();
  const isDark = theme !== 'light';
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const axisRef = useRef<null | 'x' | 'y'>(null);

  const [isDragging, setIsDragging] = useState(false);
  // Subtle fade as the card moves off in either axis — no rotation, no scale fight.
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
  const [imgReady, setImgReady] = useState(() => _loadedPokerImages.has(photo));
  const fallbackGradient = POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;

  useEffect(() => {
    if (_loadedPokerImages.has(photo)) {
      setImgReady(true);
      return;
    }
    const img = new Image();
    img.src = photo;
    img.onload = () => { _loadedPokerImages.add(photo); setImgReady(true); };
    img.onerror = () => setImgReady(false);
  }, [photo]);

  // Preload all carousel photos so cross-fades are instant.
  useEffect(() => {
    photoList.forEach((src) => {
      if (_loadedPokerImages.has(src)) return;
      const im = new Image();
      im.src = src;
      im.onload = () => _loadedPokerImages.add(src);
    });
  }, [photoList]);

  // Carousel: start ~5s in, then advance every 5–10s at random.
  // Only the visible top card animates — background cards stay static
  // to keep the deck quiet.
  useEffect(() => {
    if (!isTop || photoList.length < 2) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setPhotoIndex((i) => (i + 1) % photoList.length);
      const next = 5000 + Math.random() * 5000; // 5s–10s
      timerId = window.setTimeout(tick, next);
    };
    // Initial delay 5s.
    let timerId = window.setTimeout(tick, 5000);
    return () => { cancelled = true; clearTimeout(timerId); };
  }, [isTop, card.id, photoList.length]);

  // Reset to first photo when this card returns to the top.
  useEffect(() => {
    if (isTop) setPhotoIndex(0);
  }, [isTop, card.id]);

  useEffect(() => {
    if (!isTop) return;
    x.stop();
    y.stop();
    x.set(0);
    y.set(0);
    axisRef.current = null;
    setIsDragging(false);
  }, [card.id, isTop, x, y]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const axis = axisRef.current;
    const dx = info.offset.x;
    const dy = info.offset.y;
    const vx = info.velocity.x;
    const vy = info.velocity.y;

    const commitX = axis === 'x' && (Math.abs(dx) > PK_DIST_THRESHOLD || Math.abs(vx) > PK_VEL_THRESHOLD);
    const commitY = axis === 'y' && (Math.abs(dy) > PK_DIST_THRESHOLD * 1.1 || Math.abs(vy) > PK_VEL_THRESHOLD);

    const reset = () => {
      animate(x, 0, { ...PK_SPRING });
      animate(y, 0, { ...PK_SPRING });
      axisRef.current = null;
      setIsDragging(false);
    };

    if (commitX) {
      triggerHaptic('light');
      const direction = dx > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 480 : -480;
      // Straight horizontal exit — no rotation, no curve.
      animate(x, exitX, {
        type: 'tween',
        duration: 0.22,
        ease: [0.32, 0, 0.67, 0],
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0);
          y.set(0);
          axisRef.current = null;
          setIsDragging(false);
        }
      });
      return;
    }

    if (commitY) {
      triggerHaptic('light');
      const direction = dy > 0 ? 'right' : 'left'; // map to deck cycle
      const exitY = dy > 0 ? 700 : -700;
      // Straight vertical exit — pure translateY.
      animate(y, exitY, {
        type: 'tween',
        duration: 0.24,
        ease: [0.32, 0, 0.67, 0],
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0);
          y.set(0);
          axisRef.current = null;
          setIsDragging(false);
        }
      });
      return;
    }

    reset();
  }, [card.id, onCycle, x, y]);

  const handleDirectionLock = useCallback((axis: 'x' | 'y') => {
    axisRef.current = axis;
  }, []);

  // Stack styling — 🚀 Swipess v14.0 Reveal Logic
  // Memoized so background-card filter doesn't recompute on every render → no flicker.
    const { stackY, stackScale, stackOpacity, stackedFilter } = useMemo(() => ({
      stackY: 0,
      stackScale: 1 - (index * 0.045),
      stackOpacity: index === 0 ? 1 : Math.max(0, 0.9 - (index * 0.2)),
      // 🚀 Blur is GPU-expensive — drop it on low-end devices and rely on
      // brightness + scale + opacity for depth. On capable devices we still
      // apply a smaller blur (was 1.2px per index → now 0.6px capped at 2px).
      stackedFilter: isTop
        ? undefined
        : _isLowEndDevice
          ? `brightness(${0.92 - index * 0.08})`
          : `brightness(${0.92 - index * 0.08}) blur(${Math.min(2, index * 0.6)}px)`,
    }), [index, isTop]);

  if (index > 7) return null;

    return (
    <motion.div
      drag={isTop ? true : false}
      dragDirectionLock
      onDirectionLock={handleDirectionLock}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        triggerHaptic('light');
      }}
      onDragEnd={handleDragEnd}
      onTap={(e: any) => {
        if (isDragging || Math.abs(x.get()) >= 10) return;
        if (!isTop) {
          triggerHaptic('light');
          onBringToFront(index);
          return;
        }
        // On the top card, taps on the left/right edges toggle the
        // header + bottom-nav chrome instead of opening the category —
        // so users can summon the menus from the swipe surface itself.
        try {
          const rect = (e?.currentTarget as HTMLElement | null)?.getBoundingClientRect();
          const clientX =
            (e?.clientX ?? e?.changedTouches?.[0]?.clientX ?? e?.touches?.[0]?.clientX) as number | undefined;
          if (rect && typeof clientX === 'number') {
            const ratio = (clientX - rect.left) / rect.width;
            if (ratio < 0.22 || ratio > 0.78) {
              triggerHaptic('light');
              toggleChrome();
              return;
            }
          }
        } catch { /* fall through to default select */ }
        triggerHaptic('medium');
        onSelect(card.id);
      }}
      initial={isTop ? { y: 60, opacity: 0, scale: 0.95 } : false}
      animate={{
        y: stackY,
        opacity: stackOpacity,
        scale: isTop ? undefined : stackScale,
        zIndex: 100 - index,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        opacity: isTop ? exitOpacity : undefined,
        filter: stackedFilter,
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: 'none',
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      } as any}
      transition={{ ...PK_SPRING }}
      className="select-none touch-none"
    >
      <div
        className="w-full h-full relative overflow-hidden transition-colors duration-100 bg-black rounded-[2.5rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]"
        style={{ backgroundImage: !imgReady ? fallbackGradient : undefined }}
      >
        {/* Photo carousel — silky crossfade between admin-managed photos. */}
        <AnimatePresence initial={false}>
          <motion.img
            key={photo}
            src={photo}
            alt={card.label}
            loading="eager"
            decoding="async"
            onLoad={() => { _loadedPokerImages.add(photo); setImgReady(true); }}
            initial={{ opacity: 0, scale: _isLowEndDevice ? 1 : 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: _isLowEndDevice ? 0 : 6, ease: 'linear' },
            }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ backfaceVisibility: 'hidden' }}
            draggable={false}
          />
        </AnimatePresence>
        {/* Stronger bottom-to-top dark scrim so the title + subtitle
            always read as white over any photo — bright tan/beach
            backgrounds were washing the text out before. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Breathing existence hints — only on the top card AND only on
            capable devices. On low-end Android the four pulsing dots
            were stealing frames during swipe. */}
        {isTop && !_isLowEndDevice && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{ opacity: hintOpacity }}
          >
            {/* horizontal hint dots */}
            <div className="absolute top-1/2 left-3 -translate-y-1/2 w-1 h-8 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.4s' }} />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 w-1 h-8 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.4s' }} />
            {/* vertical hint dots */}
            <div className="absolute left-1/2 top-3 -translate-x-1/2 w-8 h-1 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '2.6s' }} />
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-8 h-1 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '2.6s' }} />
          </motion.div>
        )}
        
        {/* 🛸 Swipess METADATA CONTENT */}
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
                "font-black tracking-[calc(-0.06em)] leading-[0.85] uppercase italic text-white",
                card.label.length <= 8 ? "text-5xl" : card.label.length <= 10 ? "text-4xl" : "text-3xl"
              )}
              style={{
                color: '#FFFFFF',
                textShadow:
                  '0 2px 8px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7)',
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
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onSelect(card.id);
                }}
                className="w-full h-14 rounded-2xl"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                aria-label="Engage Discovery"
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
