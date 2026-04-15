import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARD_PHOTOS,
  POKER_CARD_GRADIENTS,
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

export const PokerCategoryCard = memo(({ card, index, total: _total, isTop, isCollapsed = false, onCycle, onSelect, onBringToFront }: PokerCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-200, 0, 200], [-6, 0, 6]);
  const isCycling = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const { tiltX, tiltY } = useDeviceParallax(0.3, 45, !isDragging && !isInteracting);

  const photo = POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.property;
  const gradient = POKER_CARD_GRADIENTS[card.id] || POKER_CARD_GRADIENTS.property;
  const [imgReady, setImgReady] = useState(false);
  const [imgError, setImgError] = useState(false);

  const frozenTilt = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setImgReady(false);
    setImgError(false);
    const img = new Image();
    img.src = photo;
    img.decode()
      .then(() => setImgReady(true))
      .catch(() => {
        if (img.complete && img.naturalWidth > 0) {
          setImgReady(true);
        } else {
          setImgError(true);
        }
      });
    img.onerror = () => setImgError(true);
  }, [photo]);

  const handlePointerDownCapture = useCallback(() => {
    frozenTilt.current = { x: tiltX, y: tiltY };
    setIsInteracting(true);
  }, [tiltX, tiltY]);

  const handlePointerReleaseCapture = useCallback(() => {
    if (!isDragging) setIsInteracting(false);
  }, [isDragging]);

  const handleDragStart = useCallback(() => {
    frozenTilt.current = { x: tiltX, y: tiltY };
    setIsDragging(true);
    setIsInteracting(true);
  }, [tiltX, tiltY]);

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (isCycling.current) return;
    const dist = Math.abs(info.offset.x);
    const vel = Math.abs(info.velocity.x);

    if (dist > 40 || vel > 250) {
      isCycling.current = true;
      triggerHaptic('medium');
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 300 : -300;

      animate(x, exitX, {
        type: 'spring',
        stiffness: 500,
        damping: 28,
        mass: 0.3,
        onComplete: () => {
          setIsDragging(false);
          setIsInteracting(false);
          onCycle(card.id, direction);
          x.set(0);
          isCycling.current = false;
        }
      });
    } else {
      triggerHaptic('light');
      animate(x, 0, {
        type: 'spring',
        stiffness: 350,
        damping: 22,
        mass: 0.3,
        onComplete: () => {
          setIsDragging(false);
          setIsInteracting(false);
        },
      });
    }
  }, [card.id, onCycle, x]);

  // iOS-style tight stack: minimal peek, aggressive scale-down, blur on bg cards
  const stackY = isCollapsed ? 0 : index * 6;
  const stackScale = 1 - (index * 0.035);
  const stackOpacity = index === 0 ? 1 : index === 1 ? 0.6 : index === 2 ? 0.3 : 0;

  const exitScale = useTransform(x, [-300, -120, 0, 120, 300], [0.88, 0.96, 1, 0.96, 0.88]);
  const exitOpacity = useTransform(x, [-300, -240, 0, 240, 300], [0, 1, 1, 1, 0]);

  // Only render top 3 cards for performance and clean look
  if (index > 3) return null;

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      dragMomentum={false}
      onPointerDownCapture={isTop ? handlePointerDownCapture : undefined}
      onPointerUpCapture={isTop ? handlePointerReleaseCapture : undefined}
      onPointerCancelCapture={isTop ? handlePointerReleaseCapture : undefined}
      onDragStart={isTop ? handleDragStart : undefined}
      onDragEnd={isTop ? handleDragEnd : undefined}
      onClick={!isTop ? () => onBringToFront(index) : undefined}
      initial={{ y: stackY + 30, opacity: 0, scale: stackScale * 0.96 }}
      animate={{
        y: stackY,
        opacity: stackOpacity,
        scale: isTop ? undefined : stackScale,
        filter: isTop ? undefined : `brightness(${1 - index * 0.12}) blur(${index * 2}px)`,
      }}
      transition={{
        type: 'spring', stiffness: 400, damping: 32, mass: 0.6,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50 - index,
        x: isTop ? x : 0,
        scale: isTop ? ((isDragging || isInteracting) ? 1 : exitScale) : undefined,
        rotateZ: isTop ? dragTilt : 0,
        opacity: isTop ? ((isDragging || isInteracting) ? 1 : exitOpacity) : undefined,
        cursor: isTop ? 'grab' : 'pointer',
        touchAction: 'none',
        willChange: 'transform, opacity',
      } as any}
      whileDrag={{ cursor: 'grabbing' }}
      className={cn('touch-manipulation select-none gpu-ultra isolation-isolate')}
    >
      <div
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: isTop
            ? (isDragging || isInteracting)
              ? `rotateX(${-frozenTilt.current.y}deg) rotateY(${frozenTilt.current.x}deg)`
              : `rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`
            : 'rotateX(4deg)',
          transition: (isDragging || isInteracting) ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <div
          className={cn(
            'w-full h-full relative overflow-hidden rounded-[28px] md:rounded-[32px]',
            isTop
              ? 'border-2 border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
              : 'border border-white/5 shadow-xl'
          )}
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={{ background: gradient }}
          />

          {!imgError && (
            <div
              className="absolute inset-0 transition-[opacity,transform] duration-500 ease-out will-change-transform"
              style={{
                opacity: imgReady ? 1 : 0,
                transform: imgReady ? 'translate3d(0,0,0)' : 'translate3d(20px,0,0)',
              }}
            >
              <img
                src={photo}
                alt={card.label}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
                loading="eager"
                style={{
                  transform: 'translateZ(0)',
                  transformOrigin: 'center center',
                  backfaceVisibility: 'hidden',
                  filter: 'saturate(1.08) contrast(1.03)',
                  animationName: imgReady && isTop ? 'photo-swim' : 'none',
                  animationDuration: '14s',
                  animationTimingFunction: 'ease-in-out',
                  animationDelay: '0.4s',
                  animationIterationCount: 'infinite',
                  animationPlayState: (isDragging || isInteracting) ? 'paused' : 'running',
                }}
              />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

          {isTop && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
              style={{
                background: 'radial-gradient(ellipse at 50% 120%, var(--primary) 0%, transparent 70%)'
              }}
            />
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-8 md:px-10 lg:px-14 pb-8 md:pb-10 lg:pb-14">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] md:text-[12px] lg:text-sm font-black uppercase tracking-[0.35em] text-white/50 mb-1">{card.description}</p>
              <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-none">{card.label}</h3>
            </div>

            {isTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                onClick={(e) => { e.stopPropagation(); onSelect(card.id); }}
                className="mt-6 w-full h-16 md:h-[72px] lg:h-20 rounded-[1.5rem] font-black text-[13px] md:text-[15px] lg:text-[17px] uppercase tracking-[0.25em] bg-white text-black active:scale-95 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center justify-center overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span>Launch {card.label}</span>
              </motion.button>
            )}
          </div>

          {!isTop && index === 1 && (
            <div className="absolute top-6 left-6 px-3 py-1 bg-black/50 rounded-full border border-white/10 backdrop-blur-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">{card.label}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
