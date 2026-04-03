import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARDS, PK_W, PK_H,
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';

export interface OwnerAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

/**
 * OwnerAllDashboard - The "All" dashboard shown on the owner side when no category is selected.
 * Same poker card fan as the client side, but for discovering clients by interest category.
 */
export const OwnerAllDashboard = ({ setCategories }: OwnerAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Periodic fold → open cycle every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      setIsCollapsed(true);
      openTimerRef.current = setTimeout(() => setIsCollapsed(false), 1600);
    }, 15000);
    return () => {
      clearInterval(interval);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  // Swipe out front card: apply filter
  const handleSwipeOut = useCallback((id: string) => {
    triggerHaptic('medium');
    setCategories([id]);
  }, [setCategories]);

  // Bring a back card to the front (tap or short drag)
  const handleBringToFront = useCallback((index: number) => {
    triggerHaptic('light');
    setCards(prev => {
      const next = [...prev];
      const [pulled] = next.splice(index, 1);
      return [pulled, ...next];
    });
  }, []);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="owner-folder-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full flex-grow flex flex-col items-center justify-center bg-transparent overflow-hidden"
        style={{
          minHeight: '280px',
          paddingTop: '20px',
        }}
      >
        {/* Folder card stack — symmetrical fanned-out flow */}
        <div
          className="relative"
          style={{
            width: PK_W,
            height: PK_H,
          }}
        >
          {/* Render back-to-front so the front card sits on top */}
          {[...cards].reverse().map((card, reversedIdx) => {
            const index = cards.length - 1 - reversedIdx;
            const isTop = index === 0;
            return (
              <PokerCategoryCard
                key={card.id}
                card={card}
                index={index}
                total={cards.length}
                isTop={isTop}
                isCollapsed={isCollapsed}
                onSwipeOut={handleSwipeOut}
                onBringToFront={handleBringToFront}
              />
            );
          })}
        </div>

        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[100px] bg-primary" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
