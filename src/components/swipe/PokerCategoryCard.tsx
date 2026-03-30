import { memo, useCallback, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  PK_W, PK_H, FOLDER_OFFSET_X, FOLDER_OFFSET_Y,
  PK_DIST_THRESHOLD, PK_VEL_THRESHOLD, PK_SPRING,
  POKER_CARD_PHOTOS, POKER_CARD_GRADIENTS, POKER_CARDS, POKER_FAN_ROTATION
} from './SwipeConstants';
import { cn } from '@/lib/utils';

interface PokerCardProps {
  card: typeof POKER_CARDS[0];
  index: number;
  total: number;
  isTop: boolean;
  isCollapsed?: boolean;
  onSwipeOut: (id: string) => void;
  onBringToFront: (index: number) => void;
}

/**
 * PokerCategoryCard - A premium, physical-feeling card for category selection.
 * Features realistic shadows, accent glows, and 3D-tilt gestures.
 */
export const PokerCategoryCard = memo(({ card, index, total, isTop, isCollapsed = false, onSwipeOut, onBringToFront }: PokerCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isExiting = useRef(false);

  // Front card tilts slightly while dragging; base offset of 3° at rest
  const dragTilt = useTransform(x, [-180, 0, 180], [-9, 3, 15]);

  // Folder-stack position
  const folderX = index * FOLDER_OFFSET_X;
  const folderY = index * FOLDER_OFFSET_Y;

  // Overlays
  const likeOpacity = useTransform(x, [20, PK_DIST_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-PK_DIST_THRESHOLD, -20], [1, 0]);

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (isExiting.current) return;
    const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const vel  = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);

    if (dist > PK_DIST_THRESHOLD || vel > PK_VEL_THRESHOLD) {
      isExiting.current = true;
      triggerHaptic('medium');
      const angle  = Math.atan2(info.offset.y, info.offset.x);
      const exitX  = Math.cos(angle) * 900;
      const exitY  = Math.sin(angle) * 900;
      animate(x, exitX, { type: 'tween', duration: 0.28, ease: [0.32, 0, 0.67, 0], onComplete: () => onSwipeOut(card.id) });
      animate(y, exitY, { type: 'tween', duration: 0.28, ease: [0.32, 0, 0.67, 0] });
    } else {
      triggerHaptic('light');
      animate(x, 0, PK_SPRING);
      animate(y, 0, PK_SPRING);
    }
  }, [card.id, onSwipeOut, x, y]);

  const handleBackDragEnd = useCallback((_: any, info: any) => {
    const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const vel  = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);
    animate(x, 0, PK_SPRING);
    animate(y, 0, PK_SPRING);
    if (dist > 55 || vel > 300) {
      triggerHaptic('medium');
      if (dist > PK_DIST_THRESHOLD || vel > PK_VEL_THRESHOLD) {
        onSwipeOut(card.id);
      } else {
        onBringToFront(index);
      }
    }
  }, [card.id, index, onSwipeOut, onBringToFront, x, y]);

  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
  const gradient = POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      drag={true}
      dragMomentum={false}
      dragElastic={isTop ? 0.55 : 0.22}
      dragConstraints={isCollapsed
        ? { left: 0, right: 0, top: 0, bottom: 0 }
        : isTop
          ? { left: -220, right: 220, top: -220, bottom: 220 }
          : { left: -70,  right: 70,  top: -70,  bottom: 70  }
      }
      onDragEnd={isTop ? handleDragEnd : handleBackDragEnd}
      onClick={() => !isTop && onBringToFront(index)}
      initial={false}
      animate={{
        x:       isCollapsed ? 0          : (isTop ? 0 : (Math.ceil(index / 2) * (index % 2 === 0 ? 1 : -1)) * FOLDER_OFFSET_X),
        y:       isCollapsed ? 0          : (isTop ? 0 : folderY),
        scale:   isCollapsed ? (isTop ? 1 : 1 - index * 0.022) : (isTop ? 1 : 1 - index * 0.012),
        opacity: index > 4 ? 0 : 1,
        rotate:  isCollapsed ? 3          : (isTop ? 3 : (Math.ceil(index / 2) * (index % 2 === 0 ? 1 : -1)) * POKER_FAN_ROTATION),
      }}
      transition={isCollapsed
        // Snap shut fast: all cards race toward front card simultaneously
        ? { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }
        // Fan back open: stagger from front outward for a dealing effect
        : { type: 'spring', stiffness: 260, damping: 26, mass: 1, delay: index * 0.06 }
      }
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: PK_W,
        height: PK_H,
        zIndex: 50 - index,
        x: isTop ? x : (Math.ceil(index / 2) * (index % 2 === 0 ? 1 : -1)) * FOLDER_OFFSET_X,
        y: isTop ? y : folderY,
        rotate: isTop ? dragTilt : (Math.ceil(index / 2) * (index % 2 === 0 ? 1 : -1)) * POKER_FAN_ROTATION,
        cursor: isTop ? 'grab' : 'pointer',
        touchAction: 'none',
      } as any}
      whileDrag={{ scale: isTop ? 1.04 : 1.07, cursor: 'grabbing' }}
      className="touch-manipulation select-none"
    >
      {/* Card face */}
      <div
        className={cn(
          "w-full h-full relative overflow-hidden rounded-[24px] bg-white",
          isTop ? "border-[2px] border-black/5 shadow-2xl" : "border border-black/5 shadow-lg"
        )}
        style={{
          boxShadow: isTop 
            ? `0 32px 64px rgba(0,0,0,0.18), 0 0 48px rgba(${card.accentRgb},0.2)` 
            : '0 12px 24px rgba(0,0,0,0.08)'
        }}
      >
        {/* Background — uses local AI image when available; falls back to gradient if img fails */}
        {!imgError ? (
          <img
            src={photo}
            alt={card.label}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: 'breathing-zoom 6s ease-in-out infinite alternate', backfaceVisibility: 'hidden', transformOrigin: 'center' }}
            loading="eager"
            draggable={false}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{ background: gradient, animation: 'breathing-zoom 6s ease-in-out infinite alternate', backfaceVisibility: 'hidden', transformOrigin: 'center' }}
          />
        )}

        {/* Soft light overlay for the info section */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent" />

        {/* Accent glow pulse on front card */}
        {isTop && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.15, 0.32, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: `inset 0 0 70px rgba(${card.accentRgb},0.22)` }}
          />
        )}

        {/* Action labels */}
        {isTop && (
          <>
            <motion.div style={{ opacity: likeOpacity, rotate: -12 }} className="absolute top-5 left-5 pointer-events-none border-2 border-emerald-600 text-emerald-600 font-black text-sm px-3 py-1 rounded-xl bg-white/90">YES!</motion.div>
            <motion.div style={{ opacity: nopeOpacity, rotate: 12 }} className="absolute top-5 right-5 pointer-events-none border-2 border-rose-600 text-rose-600 font-black text-sm px-3 py-1 rounded-xl bg-white/90">NOPE</motion.div>
          </>
        )}

        {/* Card info */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-14">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-black/45 mb-1">{card.description}</p>
          <h3 className="text-black text-3xl font-black tracking-tight uppercase leading-none">{card.label}</h3>

          {isTop && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={(e) => { e.stopPropagation(); onSwipeOut(card.id); }}
              className="mt-4 w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              style={{
                background: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.85)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                backdropFilter: 'none',
              }}
            >
              Explore
            </motion.button>
          )}
        </div>

        {!isTop && (
          <div className="absolute top-4 left-4 w-3 h-3 rounded-full opacity-75" style={{ background: card.accent }} />
        )}
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
