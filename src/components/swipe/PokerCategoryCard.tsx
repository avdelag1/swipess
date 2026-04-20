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
  const dragTilt = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const exitOpacityValue = useMotionValue(1);
  const exitScaleValue = useMotionValue(1);
  
  // Combine internal drag logic with custom vanish logic
  const dragOpacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);
  const dragScale = useTransform(x, [-250, 0, 250], [0.8, 1, 0.8]);

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
        type: 'spring',
        stiffness: 700,
        damping: 35,
        velocity: vel,
        onComplete: () => {
          onCycle(card.id, direction);
          // 🚀 SPEED OF LIGHT: x.set(0) removed to prevent flickering during parent re-render
          setIsDragging(false);
        }
      });
      // Simultaneous vanishing effects
      animate(exitOpacityValue, 0, { duration: 0.35 });
      animate(exitScaleValue, 0.4, { duration: 0.4 });
    } else {
      animate(x, 0, { ...PK_SPRING });
      animate(exitOpacityValue, 1, { duration: 0.3 });
      animate(exitScaleValue, 1, { duration: 0.3 });
      setIsDragging(false);
    }
  }, [card.id, onCycle, x]);

  // Stack styling
  // Stack styling — 🚀 NEXUS v14.0 Reveal Logic
  const stackY = isCollapsed ? 0 : index * 12; // Deeper stack
  const stackScale = 1 - (index * 0.04);
  const stackOpacity = index === 0 ? 1 : index === 1 ? 1 : index === 2 ? 0.6 : 0;
  const stackedFilter = isTop ? undefined : `brightness(${0.85 - index * 0.1}) blur(${index * 2}px)`;

  if (index > 3) return null;

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
        scale: isTop ? exitScaleValue : stackScale,
        opacity: isTop ? exitOpacityValue : stackOpacity,
        filter: stackedFilter,
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: 'none',
        willChange: 'transform, opacity',
      } as any}
      transition={{ ...PK_SPRING }}
      className="select-none touch-none"
    >
      <div className={cn(
        "w-full h-full relative overflow-hidden transition-colors duration-500",
        theme === 'ivanna-style' 
          ? "bg-card rounded-[20px_24px_22px_26px_/_26px_22px_24px_20px] shadow-artisan" 
          : "bg-black border border-white/5 rounded-[2.5rem] shadow-2xl"
      )}>
        
        {/* Photo & Gradient Base */}
        <motion.img
          src={photo}
          alt={card.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: imgReady ? 1 : 0 }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
          style={{ transform: isTop && isDragging ? 'scale(1.05)' : 'scale(1)' }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#EB4898]/20 to-transparent opacity-40 mix-blend-overlay" />
        
        {/* 🛸 NEXUS METADATA CONTENT */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-9 md:p-11 gap-8">
          
          <div className="space-y-2">
            <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2"
            >
              <div className="w-4 h-[1px] bg-[#EB4898] shadow-[0_0_8px_#EB4898]" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">{card.description}</span>
            </motion.div>
            
            <h3 className={cn(
               "text-4xl font-black tracking-tighter leading-none uppercase italic",
               theme === 'ivanna-style' ? "text-black" : "text-white"
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
                className={cn(
                  "w-full h-[72px] rounded-[2.2rem] bg-white text-black font-black uppercase italic tracking-widest text-[13px] flex items-center justify-center active:scale-95 transition-all",
                  theme === 'ivanna-style' ? "shadow-none" : "shadow-[0_25px_50px_-12px_rgba(255,255,255,0.3)]"
                )}
              >
                Engage Discovery
              </button>
            </motion.div>
          )}
        </div>

        {/* Glossy Perimeter Rim */}

      </div>
    </motion.div>
  );
});

PokerCategoryCard.displayName = 'PokerCategoryCard';
