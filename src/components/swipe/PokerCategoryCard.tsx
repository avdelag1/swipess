import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
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

export const PokerCategoryCard = memo(({ card, index, isTop, isCollapsed = false, onCycle, onSelect, onBringToFront }: PokerCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const x = useMotionValue(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragTilt = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const exitOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const exitScale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);

  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
  const gradient = POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = photo;
    img.onload = () => setImgReady(true);
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

  // Stack styling
  const stackY = isCollapsed ? 0 : index * 8;
  const stackScale = 1 - (index * 0.04);
  const stackOpacity = index === 0 ? 1 : index === 1 ? 0.7 : index === 2 ? 0.4 : 0;
  // Static blur/brightness for stacked (non-top) cards — avoids per-frame filter
  // recomposite that caused visible jitter while the top card was being dragged.
  const stackedFilter = isTop ? undefined : `brightness(${0.9 - index * 0.1}) blur(${index * 1.5}px)`;

  if (index > 3) return null;

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      onDragStart={() => {
        setIsDragging(true);
        triggerHaptic('light');
      }}
      onDragEnd={handleDragEnd}
      onTap={() => {
        if (!isDragging) {
          if (isTop) {
            triggerHaptic('medium');
            onSelect(card.id);
          } else {
            triggerHaptic('light');
            onBringToFront(index);
          }
        }
      }}
      initial={isTop ? { y: 60, opacity: 0, scale: 0.9 } : false}
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
      } as any}
      transition={{ ...PK_SPRING }}
      className="select-none touch-none"
    >
      <div
        className="w-full h-full relative overflow-hidden rounded-[28px] bg-black"
        style={{
          boxShadow: 'none',
        }}
      >
        {/* Gradient backdrop */}
        <div className="absolute inset-0" style={{ background: gradient, opacity: 0.15 }} />
        
        {/* Photo with fade-in */}
        <motion.img
          src={photo}
          alt={card.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: imgReady ? 1 : 0 }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Liquid Overlays */}
        {/* Liquid Overlays — SHADES REMOVED */}
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 md:p-10">
          <div className="mb-8 pointer-events-none">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">{card.description}</p>
            <h3 className="text-white text-3xl font-black tracking-tight leading-none uppercase">{card.label}</h3>
          </div>

          {isTop && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onSelect(card.id);
                }}
                className="w-full h-[64px] rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center shadow-[0_12px_24px_rgba(255,255,255,0.25)] active:scale-95 transition-all"
              >
                Launch {card.label}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
