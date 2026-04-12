import { memo, useCallback, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  PK_W, PK_H,
  PK_SPRING,
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
  const dragTilt = useTransform(x, [-250, 0, 250], [-15, 0, 15]);
  const gyroX = useMotionValue(0);
  const gyroY = useMotionValue(0);
  const isCycling = useRef(false);

  // Parallax Device Tilt (Gyroscope)
  useEffect(() => {
    if (!isTop) return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma is left/right [-90, 90]
        // beta is front/back [-180, 180]
        const tiltX = Math.max(-15, Math.min(15, e.gamma / 2));
        const tiltY = Math.max(-15, Math.min(15, (e.beta - 45) / 2)); // Offset assuming they hold phone at 45 deg angle
        gyroY.set(tiltX);
        gyroX.set(-tiltY); // rotateX handles up/down tilt
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isTop, gyroX, gyroY]);

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (isCycling.current) return;
    const dist = Math.abs(info.offset.x);
    const vel  = Math.abs(info.velocity.x);

    if (dist > 80 || vel > 400) {
      isCycling.current = true;
      triggerHaptic('medium');
      const direction = info.offset.x > 0 ? 'right' : 'left';

      // Recede behind: animate x slightly while scale+opacity handle via useTransform
      animate(x, direction === 'right' ? 250 : -250, { 
        type: 'tween', 
        duration: 0.4,
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

  const stackY = isCollapsed ? 0 : index * 18;
  const stackScale = 1 - (index * 0.04);
  const stackBrightness = 1 - (index * 0.08);

  // Depth exit: scale shrinks and opacity fades as card moves away
  const exitScale = useTransform(x, [-250, -100, 0, 100, 250], [0.5, 0.85, 1, 0.85, 0.5]);
  const exitOpacity = useTransform(x, [-250, -180, 0, 180, 250], [0, 0.5, 1, 0.5, 0]);

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: -150, right: 150 }}
      dragElastic={0.5}
      onDragEnd={isTop ? handleDragEnd : undefined}
      onClick={!isTop ? () => onBringToFront(index) : undefined}
      initial={false}
      animate={{
        y: stackY,
        opacity: index > 4 ? 0 : 1,
        // Remove rotateX from animate to let useMotionValue control it exclusively on top
        filter: isTop ? undefined : `brightness(${stackBrightness})`,
      }}
      transition={{ type: 'spring', stiffness: 180, damping: 26, mass: 1.2 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50 - index,
        x: isTop ? x : 0,
        scale: isTop ? exitScale : stackScale,
        rotateZ: isTop ? dragTilt : 0, 
        rotateX: isTop ? gyroX : 6, // 6 deg tilt when in stack
        rotateY: isTop ? gyroY : 0,
        opacity: isTop ? exitOpacity : (index > 4 ? 0 : 1),
        cursor: isTop ? 'grab' : 'pointer',
        touchAction: 'none',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      } as any}
      whileDrag={{ cursor: 'grabbing' }}
      className={cn("touch-manipulation select-none gpu-ultra isolation-isolate")}
    >
      <div
        className={cn(
          "w-full h-full relative overflow-hidden rounded-[48px] transition-all duration-300",
          isTop ? "border-2 border-white/10 shadow-2xl" : "border border-white/5 shadow-xl"
        )}
      >
        {/* Flagship Imagery */}
        {!imgError ? (
          <motion.img
            src={photo}
            alt={card.label}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            draggable={false}
            loading="eager"
            decoding="sync"
            onError={() => setImgError(true)}
            style={{ 
              opacity: 1, 
              filter: 'none',
              transform: 'translateZ(0)', // Force GPU layer
            }}
          />
        ) : (
          <motion.div
            className="absolute inset-0 w-full h-full"
            style={{ background: gradient }}
          />
        )}

        {/* Cinematic gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Info section */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-8 pb-8">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50 mb-1">{card.description}</p>
            <h3 className="text-white text-3xl font-black tracking-tight uppercase leading-none">{card.label}</h3>
          </div>

          {isTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              onClick={(e) => { e.stopPropagation(); onSelect(card.id); }}
              className="mt-6 w-full h-16 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.25em] bg-white/10 backdrop-blur-xl text-white border border-white/30 active:scale-95 transition-transform shadow-[0_16px_32px_rgba(0,0,0,0.4)] flex items-center justify-center"
            >
              Launch {card.label}
            </motion.button>
          )}
        </div>

        {/* Small floating tag for background cards */}
        {!isTop && (
          <div className="absolute top-8 left-8 px-4 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 shadow-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{card.label}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
