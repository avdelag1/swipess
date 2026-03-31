import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARDS, PK_W, PK_H,
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';

export interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

/**
 * SwipeAllDashboard - The "All" dashboard shown when no specific category is selected.
 * Presents a fanned-out deck of categories for the user to choose from.
 * Every 15s the hand folds shut then fans back open.
 */
export const SwipeAllDashboard = ({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Periodic fold → open cycle every 15 seconds
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
        key="folder-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full flex-grow flex flex-col items-center justify-center bg-background overflow-hidden"
        style={{
          minHeight: '100dvh',
          paddingTop: 'calc(64px + var(--safe-top))',
          paddingBottom: 'calc(68px + var(--safe-bottom))',
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.05] blur-[100px] bg-primary animate-pulse-slow" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
