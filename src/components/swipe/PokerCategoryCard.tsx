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

  // Keep the card completely solid while swiping, exactly like the main swipe cards.
  const exitOpacity = useTransform(
    [x, y] as any,
    ([_cx, _cy]: any) => 1
  );
  
  const rotate = useTransform(x, [-800, 800], [-25, 25]); // Matched with SimpleSwipeCard curvature
  // Faint breathing hints — visible only while idle on the top card.
  const hintOpacity = useTransform(
    [x, y] as any,
    ([cx, cy]: any) => (Math.abs(cx) + Math.abs(cy) > 4 ? 0 : 1)
  );

  // ONE STATIC PHOTO per poker card — no carousel, no auto-cycle, no crossfade.
  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
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

  // Stacked cards sit exactly behind the top card, so they only become visible
  // as the top card slides away — at which point we want them fully solid (like
  // the next page of a book). No brightness filter: a CSS filter on a moving
  // card forces a full per-frame re-raster of the photo and flickers on mobile.
  const stackOpacity = 1;

  if (index > 7) return null;

  return (
    <motion.div
      // Only the top card is draggable. No constraints — let the card move
      // freely so the exit animate() to ±520 isn't fought by constraint springs.
      drag={isTop ? true : false}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 800, bounceDamping: 25 }} // Instantly glues to finger
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
        y: isTop ? y : 0,
        zIndex: 100 - index,
        opacity: isTop ? exitOpacity : stackOpacity,
        scale: 1,
        rotate,
        cursor: isTop ? (isDraggingVisual ? 'grabbing' : 'grab') : 'pointer',
        touchAction: 'none',
        willChange: 'transform, opacity',
        transform: 'translate3d(0,0,0)',
        transformOrigin: '50% 120%', // Pivot from bottom so it feels like a heavy physical card
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        borderRadius: 40, // Match the 2.5rem exactly on the GPU layer
        boxShadow: isTop ? '0 30px 60px -20px rgba(0,0,0,0.55)' : 'none',
        backgroundColor: '#000',
        backgroundImage: fallbackGradient,
      } as any}
      transition={{ ...PK_SPRING }}
      className="select-none gpu-ultra"
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 'inherit',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Single static photo — no carousel, no crossfade */}
        <img
          src={photo}
          alt={card.label}
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ backfaceVisibility: 'hidden' }}
          draggable={false}
        />

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />

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
                style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
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
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-widest transition-all hover:scale-[1.02] active:scale-95 text-black shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/40"
                style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)' }}
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
