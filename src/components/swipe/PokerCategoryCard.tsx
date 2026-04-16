import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARD_PHOTOS,
  POKER_CARD_GRADIENTS,
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

    if (Math.abs(dist) > 50 || Math.abs(vel) > 300) {
      triggerHaptic('medium');
      const direction = dist > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 300 : -300;

      animate(x, exitX, {
        type: 'spring', stiffness: 500, damping: 30, mass: 0.5,
        onComplete: () => {
          onCycle(card.id, direction);
          x.set(0);
          setIsDragging(false);
        }
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 });
      setIsDragging(false);
    }
  }, [card.id, onCycle, x]);

  // Stack styling
  const stackY = isCollapsed ? 0 : index * 8;
  const stackScale = 1 - (index * 0.04);
  const stackOpacity = index === 0 ? 1 : index === 1 ? 0.7 : index === 2 ? 0.4 : 0;

  if (index > 3) return null;

  return (
    <motion.div
      layout
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
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
      initial={{ y: 60, opacity: 0, scale: 0.9 }}
      animate={{
        y: stackY,
        opacity: stackOpacity,
        scale: isTop ? undefined : stackScale,
        filter: isTop ? undefined : `brightness(${0.9 - index * 0.1}) blur(${index * 1.5}px)`,
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
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: 'none',
        willChange: 'transform, opacity',
      } as any}
      transition={{ type: 'spring', stiffness: 550, damping: 32, mass: 0.8 }}
      className="select-none touch-none"
    >
      <div className="w-full h-full relative overflow-hidden rounded-[32px] bg-black">
        {/* Gradient backdrop */}
        <div className="absolute inset-0" style={{ background: gradient }} />
        
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 md:p-10 pointer-events-none">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">{card.description}</p>
            <h3 className="text-white text-3xl font-black tracking-tight leading-none uppercase">{card.label}</h3>
          </div>

          {isTop && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-full h-[64px] rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center shadow-[0_12px_24px_rgba(255,255,255,0.25)] active:scale-95 transition-all">
                Launch {card.label}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
