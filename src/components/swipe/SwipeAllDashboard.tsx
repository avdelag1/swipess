import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { 
  POKER_CARDS, PK_W, PK_H, FOLDER_OFFSET_X, FOLDER_OFFSET_Y 
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';

export interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

/**
 * SwipeAllDashboard - The "All" dashboard shown when no specific category is selected.
 * Presents a fanned-out deck of categories for the user to choose from.
 */
export const SwipeAllDashboard = ({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);

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

  const N = cards.length;
  // Container is sized to show the full front card plus the peeking strips of back cards
  const containerW = PK_W + (N - 1) * FOLDER_OFFSET_X;
  const containerH = PK_H + (N - 1) * FOLDER_OFFSET_Y;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="folder-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full flex-grow flex flex-col items-center justify-center bg-background overflow-hidden min-h-[calc(100dvh-148px)]"
      >
        {/* Folder card stack — straight horizontal flow, no rotation */}
        <div
          className="relative"
          style={{
            width: containerW,
            height: containerH,
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
                onSwipeOut={handleSwipeOut}
                onBringToFront={handleBringToFront}
              />
            );
          })}
        </div>

        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[90px] bg-primary animate-pulse-slow" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
