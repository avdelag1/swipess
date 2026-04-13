import { memo, useCallback, useRef, useState, useEffect } from 'react';
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
import { useDeviceParallax } from '@/hooks/useDeviceParallax';

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
  const { tiltX, tiltY } = useDeviceParallax(0.3);
  const isCycling = useRef(false);

  // Image preloading with decode() for flicker-free reveal
  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
  const gradient = POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  const [imgReady, setImgReady] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgReady(false);
    setImgError(false);
    const img = new Image();
    img.src = photo;
    img.decode()
      .then(() => setImgReady(true))
      .catch(() => {
        // Fallback: if decode fails, still try to show if loaded
        if (img.complete && img.naturalWidth > 0) {
          setImgReady(true);
        } else {
          setImgError(true);
        }
      });
    img.onerror = () => setImgError(true);
  }, [photo]);

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (isCycling.current) return;
    const dist = Math.abs(info.offset.x);
    const vel  = Math.abs(info.velocity.x);

    if (dist > 60 || vel > 350) {
      isCycling.current = true;
      triggerHaptic('medium');
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 300 : -300;

      animate(x, exitX, { 
        type: 'spring', 
        stiffness: 600,
        damping: 40,
        mass: 0.8,
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0); 
          isCycling.current = false;
        } 
      });
    } else {
      triggerHaptic('light');
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 30, mass: 0.6 });
    }
  }, [card.id, onCycle, x]);

  const stackY = isCollapsed ? 0 : index * 12;
  const stackScale = 1 - (index * 0.04);
  const stackBrightness = 1 - (index * 0.05);

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
      initial={{ y: stackY + 40, opacity: 0, scale: stackScale * 0.95 }}
      animate={{
        y: stackY,
        opacity: index > 4 ? 0 : 1,
        rotateX: isTop ? 0 : 6, 
        scale: isTop ? undefined : stackScale,
        filter: isTop ? undefined : `brightness(${stackBrightness})`,
      }}
      transition={{ 
        type: 'spring', stiffness: 180, damping: 26, mass: 1.2,
        // Stagger entrance: each card delays slightly based on index
        delay: index * 0.06,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50 - index,
        x: isTop ? x : 0,
        scale: isTop ? exitScale : undefined,
        rotateZ: isTop ? dragTilt : 0,
        rotateX: isTop ? -tiltY : (index > 4 ? 0 : 6),
        rotateY: isTop ? tiltX : 0,
        opacity: isTop ? exitOpacity : undefined,
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
          "w-full h-full relative overflow-hidden rounded-[48px]",
          isTop ? "border-2 border-white/10 shadow-2xl" : "border border-white/5 shadow-xl"
        )}
      >
        {/* Gradient base — always visible immediately */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: gradient }}
        />

        {/* Photo — fades in only after decode() completes */}
        {!imgError && (
          <img
            src={photo}
            alt={card.label}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out"
            draggable={false}
            loading="eager"
            style={{ 
              opacity: imgReady ? 1 : 0, 
              transform: 'translateZ(0)',
              animation: imgReady 
                ? 'photo-swim 14s ease-in-out 0.4s infinite' 
                : 'none',
            }}
          />
        )}

        {/* Cinematic gradient overlay & Liquid Glow */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
        
        {isTop && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay animate-pulse"
            style={{
              background: 'radial-gradient(ellipse at 50% 120%, var(--primary) 0%, transparent 70%)'
            }}
          />
        )}

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
              transition={{ delay: 0.15 }}
              onClick={(e) => { e.stopPropagation(); onSelect(card.id); }}
              className="mt-6 w-full h-16 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.25em] bg-white text-black active:scale-95 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center justify-center overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span>Launch {card.label}</span>
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
