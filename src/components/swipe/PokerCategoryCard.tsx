import { memo, useCallback, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
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

/**
 * 🃏 PokerCategoryCard — CYCLIC REBORN 🎰
 * 
 * Re-imagined for high-frequency browsing.
 * Features a 'Deep Perspective Stack' so you can see all the filters waiting on the back.
 * Narrower and Taller cards provide a modern 'Story/Reel' feel optimally scaled for mobile.
 */
export const PokerCategoryCard = memo(({ card, index, total: _total, isTop, isCollapsed = false, onCycle, onSelect, onBringToFront, cardHeight }: PokerCardProps) => {
  const height = cardHeight ?? PK_H;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const isCycling = useRef(false);

  // High-performance cycle logic
  const handleDragEnd = useCallback((_: any, info: any) => {
    if (isCycling.current) return;
    const dist = Math.abs(info.offset.x);
    const vel  = Math.abs(info.velocity.x);

    if (dist > 80 || vel > 400) {
      isCycling.current = true;
      triggerHaptic('medium');
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 700 : -700;

      // Zenith Cycle: Fly out then rotate to back state
      animate(x, exitX, { 
        type: 'tween', 
        duration: 0.22, // High-frequency snap
        ease: [0.32, 0, 0.67, 0], 
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

  // 🚀 ZENITH DEPTH: Dynamic stack perspective
  // Cards behind the front one are physically stacked with clear visibility
  const stackY = isCollapsed ? 0 : index * 24; // Increased Y-shift for 'larger' feel
  const stackScale = 1 - (index * 0.08); // More pronounced scale difference
  const stackBlur = index * 0.8;
  const stackBrightness = 1 - (index * 0.12);

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.5}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={false}
      animate={{
        x: isTop ? x.get() : 0,
        y: stackY,
        scale: stackScale,
        opacity: index > 4 ? 0 : 1,
        // Tilt the deck slightly for a physical fanned-out book feel
        rotateX: isTop ? 0 : 8, 
        filter: `brightness(${stackBrightness}) blur(${stackBlur}px)`,
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
        cursor: isTop ? 'grab' : 'pointer',
        touchAction: 'none',
        transformStyle: 'preserve-3d',
      } as any}
      whileDrag={{ scale: isTop ? 1.05 : 1 }}
      className="touch-manipulation select-none"
    >
      <div
        className={cn(
          "w-full h-full relative overflow-hidden rounded-[48px] bg-white transition-all duration-300",
          isTop ? "border-2 border-black/5 shadow-[0_45px_100px_rgba(0,0,0,0.25)]" : "border border-black/10 shadow-xl"
        )}
      >
        {/* Flagship Imagery */}
        {!imgError ? (
          <motion.img
            src={photo}
            alt={card.label}
            className="absolute inset-x-0 top-0 w-full h-[88%] object-cover"
            draggable={false}
            onError={() => setImgError(true)}
          />
        ) : (
          <motion.div
            className="absolute inset-x-0 top-0 w-full h-[88%]"
            style={{ background: gradient }}
          />
        )}

        {/* Info section anchors the bottom with premium typography */}
        <div className="absolute inset-x-0 bottom-0 h-[25%] bg-white/95 backdrop-blur-md flex flex-col justify-center px-8 pb-8">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/35 mb-1">{card.description}</p>
            <h3 className="text-black text-3xl font-black tracking-tight uppercase leading-none">{card.label}</h3>
          </div>

          <AnimatePresence>
            {isTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onSelect(card.id); }}
                className="mt-5 w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] bg-black text-white active:scale-95 transition-transform shadow-[0_12px_24px_rgba(0,0,0,0.2)] flex items-center justify-center"
                style={{
                  background: isDark ? '#000' : '#111',
                }}
              >
                Launch {card.label}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Small floating tag for background cards visibility */}
        {!isTop && (
          <div className="absolute top-8 left-8 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-black/5 shadow-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/60">{card.label}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
