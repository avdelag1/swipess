import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Detect low-end / reduced-motion devices once at module load.
const _isLowEndDevice = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lowMem = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
    return Boolean(reducedMotion || lowMem);
  } catch { return false; }
})();

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const PokerCategoryCard = memo(({ card, index, isTop, isCollapsed: _isCollapsed = false, onCycle, onSelect, onBringToFront }: PokerCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isDraggingRef = useRef(false);
  const isExitingRef = useRef(false);
  const engageButtonRef = useRef<HTMLButtonElement>(null);

  const exitOpacity = useTransform(
    [x, y] as any,
    ([_cx, _cy]: any) => 1
  );

  const rotate = useTransform(x, [-800, 800], [-10, 10]);
  const hintOpacity = useTransform(
    [x, y] as any,
    ([cx, cy]: any) => (Math.abs(cx) + Math.abs(cy) > 4 ? 0 : 1)
  );

  // Photo rotation: shuffle all photos for this category and cycle through them
  const photos = useMemo(() => {
    const raw = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
    return shuffleArray(Array.isArray(raw) ? raw : [raw]);
  }, [card.id]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [nextPhotoIndex, setNextPhotoIndex] = useState(1);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rotate photos every 4 seconds when this is the top card
  useEffect(() => {
    if (!isTop || photos.length <= 1 || _isLowEndDevice) return;

    intervalRef.current = setInterval(() => {
      setNextPhotoIndex(prev => (prev + 1) % photos.length);
      setIsCrossfading(true);
      timeoutRef.current = setTimeout(() => {
        setPhotoIndex(prev => (prev + 1) % photos.length);
        setNextPhotoIndex(prev => (prev + 1) % photos.length);
        setIsCrossfading(false);
      }, 600);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isTop, photos.length]);

  // Manual photo browse via horizontal drag on the photo area
  const photoSwipeRef = useRef<{ startX: number; startY: number } | null>(null);

  const handlePhotoDragStart = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    photoSwipeRef.current = { startX: e.clientX, startY: e.clientY };
  }, [isTop]);

  const handlePhotoDragEnd = useCallback((e: React.PointerEvent) => {
    if (!photoSwipeRef.current || !isTop || photos.length <= 1) return;
    const dx = e.clientX - photoSwipeRef.current.startX;
    const dy = Math.abs(e.clientY - photoSwipeRef.current.startY);
    photoSwipeRef.current = null;

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) > 30 && Math.abs(dx) > dy * 1.5) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      triggerHaptic('light');
      if (dx < 0) {
        setPhotoIndex(prev => (prev + 1) % photos.length);
        setNextPhotoIndex(prev => (prev + 2) % photos.length);
      } else {
        setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
        setNextPhotoIndex(prev => prev);
      }
    }
  }, [isTop, photos.length]);

  const fallbackGradient = useMemo(() => {
    return POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  }, [card.id]);


  // Reset drag state when card becomes top.
  useEffect(() => {
    if (!isTop) return;
    x.stop();
    y.stop();
    x.set(0);
    y.set(0);
    isDraggingRef.current = false;
    isExitingRef.current = false;
  }, [card.id, isTop, x, y]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (isExitingRef.current) return;

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

    animate(x, 0, { ...PK_SPRING });

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, [card.id, onCycle, x]);

  const stackOpacity = 1;

  if (index > 7) return null;

  // Photo dot indicators
  const showDots = isTop && photos.length > 1 && !_isLowEndDevice;

  return (
    <motion.div
      data-quick-filter-card
      data-skip-press-engine
      drag={isTop ? "x" : false}
      dragDirectionLock={isTop ? true : undefined}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 800, bounceDamping: 25 }}
      onDragStart={() => {
        if (isExitingRef.current) return;
        isDraggingRef.current = true;
        triggerHaptic('light');
      }}
      onDragEnd={handleDragEnd}
      onTap={(e: any) => {
        if (isDraggingRef.current || isExitingRef.current) return;
        if (Math.abs(x.get()) >= 8) return;

        if (!isTop) {
          triggerHaptic('light');
          onBringToFront(index);
          return;
        }

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
        y: isTop ? y : 0,
        zIndex: 100 - index,
        opacity: isTop ? exitOpacity : stackOpacity,
        scale: 1,
        rotate,
        touchAction: 'none',
        willChange: 'transform, opacity',
        transformOrigin: '50% 50%',
        backfaceVisibility: 'hidden',
        boxShadow: isTop ? '0 30px 60px -20px rgba(0,0,0,0.55)' : 'none',
        backgroundColor: '#000',
        backgroundImage: fallbackGradient,
      } as any}
      transition={{ ...PK_SPRING }}
      className={cn(
        "force-white select-none touch-none relative w-full h-full overflow-hidden border-none gpu-ultra rounded-[2.5rem]",
        isTop ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 'inherit',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onPointerDown={handlePhotoDragStart}
        onPointerUp={handlePhotoDragEnd}
      >
        {/* Current photo */}
        <img
          src={photos[photoIndex]}
          alt={card.label}
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none',
            opacity: isCrossfading ? 0 : 1,
          }}
          draggable={false}
        />

        {/* Next photo (crossfade layer) */}
        {photos.length > 1 && (
          <img
            src={photos[nextPhotoIndex]}
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              touchAction: 'none',
              opacity: isCrossfading ? 1 : 0,
            }}
            draggable={false}
          />
        )}

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />

        {/* Darken background cards */}
        {!isTop && (
          <div
            className="absolute inset-0 bg-black pointer-events-none z-[11] transition-opacity duration-300"
            style={{ opacity: 0.05 + index * 0.05 }}
          />
        )}

        {/* Photo dot indicators */}
        {showDots && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-[15] flex items-center gap-1.5"
            style={{ opacity: hintOpacity }}
          >
            {photos.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === photoIndex ? 16 : 5,
                  height: 5,
                  background: i === photoIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Breathing swipe-hint dots — top card only, capable devices only */}
        {isTop && !_isLowEndDevice && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[15]"
            style={{ opacity: hintOpacity }}
          >
            <div className="absolute top-1/2 left-3 -translate-y-1/2 w-1 h-8 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.4s' }} />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 w-1 h-8 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.4s' }} />
            <div className="absolute left-1/2 top-3 -translate-x-1/2 w-8 h-1 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '2.6s' }} />
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-8 h-1 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '2.6s' }} />
          </motion.div>
        )}

        {/* Card content */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-9 md:p-11 gap-8 z-20 pointer-events-none">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-[1px] shadow-[0_0_8px_rgba(255,255,255,0.4)] bg-white/40" />
              <span
                className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white"
                style={{
                  textShadow: '0 2px 6px rgba(0,0,0,0.7)',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {card.description}
              </span>
            </div>

            <h3
              className={cn(
                'font-black tracking-[calc(-0.06em)] leading-[0.85] uppercase italic text-white force-white',
                card.label.length <= 8 ? 'text-5xl' : card.label.length <= 10 ? 'text-4xl' : 'text-3xl'
              )}
              style={{
                color: '#FFFFFF',
                textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7)',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              {card.label}
            </h3>
          </div>

          <div className={isTop ? 'pointer-events-auto' : 'pointer-events-none'}>
              <button
                type="button"
                ref={engageButtonRef}
                onPointerDown={(e) => { if (isTop) e.stopPropagation(); }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTop || isDraggingRef.current || isExitingRef.current) return;
                  triggerHaptic('medium');
                  onSelect(card.id);
                }}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-widest transition-all duration-300 active:scale-90 text-white shadow-[0_18px_40px_rgba(0,0,0,0.5)] border border-white/25"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.10) 100%)', backdropFilter: 'blur(20px) saturate(1.8)', WebkitBackdropFilter: 'blur(20px) saturate(1.8)' }}
                aria-label="Engage Discovery"
              >
                {card.icon && <card.icon className="w-5 h-5" />}
                <span>Engage Discovery</span>
              </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
