import { memo, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { ThumbsUp, Sparkles, X } from 'lucide-react';
import useAppTheme from '@/hooks/useAppTheme';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARD_PHOTOS,
  POKER_CARD_GRADIENTS,
  PokerCardData,
  PK_DIST_THRESHOLD,
  PK_VEL_THRESHOLD,
  PK_SPRING,
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

// Module-level cache so re-mounts (cycling through deck) don't re-flash imgReady=false
const _loadedPokerImages = new Set<string>();

export const PokerCategoryCard = memo(({ card, index, isTop, isCollapsed = false, onCycle, onSelect, onBringToFront }: PokerCardProps) => {
  const { theme } = useAppTheme();
  const isDark = theme !== 'light';
  const x = useMotionValue(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragTilt = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const exitOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const exitScale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);
  // Compositor-driven photo zoom — driven by drag motion value, not React re-renders.
  // Tiny zoom (1 → 1.04) tracks the drag distance smoothly without fighting the parent transform.
  const photoScale = useTransform(x, [-200, 0, 200], [1.04, 1, 1.04]);

  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
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

  const handleDragEnd = useCallback((_: any, info: any) => {
    const dist = info.offset.x;
    const vel = info.velocity.x;

    if (Math.abs(dist) > PK_DIST_THRESHOLD || Math.abs(vel) > PK_VEL_THRESHOLD) {
      triggerHaptic('light');
      const direction = dist > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 320 : -320;

      animate(x, exitX, {
        ...PK_SPRING,
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0);
          setIsDragging(false);
        }
      });
    } else {
      animate(x, 0, { ...PK_SPRING });
      setIsDragging(false);
    }
  }, [card.id, onCycle, x]);

  // Stack styling — 🚀 Swipess v14.0 Reveal Logic
  // Memoized so background-card filter doesn't recompute on every render → no flicker.
    const { stackY, stackScale, stackOpacity, stackedFilter } = useMemo(() => ({
      stackY: 0,
      stackScale: 1 - (index * 0.045),
      stackOpacity: index === 0 ? 1 : Math.max(0, 0.9 - (index * 0.2)),
      stackedFilter: isTop ? undefined : `brightness(${0.92 - index * 0.08}) blur(${index * 1.2}px)`,
    }), [index, isTop]);

  if (index > 7) return null;

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragStart={() => {
        setIsDragging(true);
        triggerHaptic('light');
      }}
      onDragEnd={handleDragEnd}
      onTap={() => {
        if (!isDragging && Math.abs(x.get()) < 10) {
          if (isTop) {
            triggerHaptic('medium');
            onSelect(card.id);
          } else {
            triggerHaptic('light');
            onBringToFront(index);
          }
        }
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
        rotateZ: isTop ? dragTilt : 0,
        scale: isTop ? exitScale : undefined,
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
        className="w-full h-full relative overflow-hidden transition-colors duration-100 bg-black rounded-[2.5rem]"
        style={{ backgroundImage: !imgReady ? fallbackGradient : undefined }}
      >
        {/* Photo & Gradient Base — compositor-only zoom driven by motion value, no inline transform fight */}
        <motion.img
          src={photo}
          alt={card.label}
          initial={{ opacity: imgReady ? 1 : 0 }}
          animate={{ opacity: imgReady ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            scale: isTop ? photoScale : 1,
            willChange: isTop ? 'transform' : undefined,
            backfaceVisibility: 'hidden',
          }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        
        {/* 🛸 Swipess METADATA CONTENT */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-9 md:p-11 gap-8">
          
          <div className="space-y-2">
            <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2"
            >
              <div className="w-4 h-[1px] shadow-[0_0_8px_rgba(255,255,255,0.4)] bg-white/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white/80">{card.description}</span>
            </motion.div>
            
            <h3 className={cn(
              "font-black tracking-[calc(-0.06em)] leading-[0.85] uppercase italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
              card.label.length <= 8 ? "text-5xl" : card.label.length <= 10 ? "text-4xl" : "text-3xl"
            )}>
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
                className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest transition-all hover:scale-[1.02] active:scale-95 text-black shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/40"
                style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)' }}
              >
                Engage Discovery
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
