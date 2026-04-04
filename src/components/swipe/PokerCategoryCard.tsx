import { memo, useCallback, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  PK_W, PK_H, FOLDER_OFFSET_Y,
  PK_DIST_THRESHOLD, PK_VEL_THRESHOLD, PK_SPRING,
  POKER_CARD_PHOTOS, POKER_CARD_GRADIENTS,
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

export const PokerCategoryCard = memo(({ card, index, total: _total, isTop, isCollapsed = false, onCycle, onSelect, onBringToFront, cardHeight }: PokerCardProps) => {
  const height = cardHeight ?? PK_H;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const isCycling = useRef(false);

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (isCycling.current) return;
    const dist = Math.abs(info.offset.x);
    const vel  = Math.abs(info.velocity.x);

    if (dist > 80 || vel > 400) {
      isCycling.current = true;
      triggerHaptic('medium');
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 300 : -300;

      // Depth exit: shrink + fade as if receding into the distance
      animate(x, exitX, { 
        type: 'tween', 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0); 
          isCycling.current = false;
        } 
      });
    } else {
      triggerHaptic('light');
      animate(x, 0, PK_SPRING);
    }
  }, [card.id, onCycle, x]);

  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
  const gradient = POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  const [imgError, setImgError] = useState(false);

  const stackY = isCollapsed ? 0 : index * 24;
  const stackScale = 1 - (index * 0.08);
  const stackBlur = index * 0.8;
  const stackBrightness = 1 - (index * 0.12);

  // Derive exit scale/opacity from x position for depth effect
  const exitScale = useTransform(x, [-300, 0, 300], [0.7, 1, 0.7]);
  const exitOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 0.7, 1, 0.7, 0]);

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.5}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={false}
      animate={{
        y: stackY,
        scale: isTop ? undefined : stackScale,
        opacity: index > 4 ? 0 : 1,
        rotateX: isTop ? 0 : 8, 
        filter: isTop ? undefined : `brightness(${stackBrightness}) blur(${stackBlur}px)`,
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.8 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: PK_W,
        height: height,
        zIndex: 50 - index,
        x: isTop ? x : 0,
        scale: isTop ? exitScale : stackScale,
        opacity: isTop ? exitOpacity : (index > 4 ? 0 : 1),
        cursor: isTop ? 'grab' : 'pointer',
        touchAction: 'none',
        transformStyle: 'preserve-3d',
      } as any}
      whileDrag={{ scale: isTop ? 1.05 : 1 }}
      className="touch-manipulation select-none"
    >
      <div
        className={cn(
          "w-full h-full relative overflow-hidden rounded-[48px] transition-all duration-300",
          isTop ? "border-2 border-white/10 shadow-[0_45px_100px_rgba(0,0,0,0.25)]" : "border border-white/5 shadow-xl"
        )}
      >
        {/* Flagship Imagery */}
        {!imgError ? (
          <motion.img
            src={photo}
            alt={card.label}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            onError={() => setImgError(true)}
          />
        ) : (
          <motion.div
            className="absolute inset-0 w-full h-full"
            style={{ background: gradient }}
          />
        )}

        {/* Cinematic gradient overlay — replaces white bg */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Info section with transparent background */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-8 pb-8">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50 mb-1">{card.description}</p>
            <h3 className="text-white text-3xl font-black tracking-tight uppercase leading-none">{card.label}</h3>
          </div>

          <AnimatePresence>
            {isTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onSelect(card.id); }}
                className="mt-5 w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] bg-white text-black active:scale-95 transition-transform shadow-[0_12px_24px_rgba(0,0,0,0.3)] flex items-center justify-center"
              >
                Launch {card.label}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Small floating tag for background cards */}
        {!isTop && (
          <div className="absolute top-8 left-8 px-4 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 shadow-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{card.label}</p>
          </div>
        )}

        {/* Pulsing swipe hint arrows — only on top card */}
        {isTop && (
          <>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 swipe-hint-left pointer-events-none">
              <ChevronLeft size={20} className="text-white" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 swipe-hint-right pointer-events-none">
              <ChevronRight size={20} className="text-white" />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
