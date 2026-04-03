import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  OWNER_INTENT_CARDS,
  OwnerIntentCard,
  PK_W,
  OWNER_PK_H,
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';

export interface OwnerAllDashboardProps {
  onCardSelect: (card: OwnerIntentCard) => void;
}

/**
 * 🃏 OwnerAllDashboard — CYCLIC EDITION 🎰
 * 
 * Re-imagined as a continuous carousel of client intents.
 * Owner-side quick filters now follow the flagship cyclic-carousel interaction model.
 * Swipe left/right cycle the intent deck; select to filter the client deck.
 */
export const OwnerAllDashboard = memo(({ onCardSelect }: OwnerAllDashboardProps) => {
  const [cards, setCards] = useState([...OWNER_INTENT_CARDS]);

  // Cycle: move the front intent to the back
  const handleCycle = useCallback((id: string, direction: 'left' | 'right') => {
    triggerHaptic('medium');
    setCards(prev => {
      if (prev[0].id !== id) return prev;
      const next = [...prev];
      const [current] = next.splice(0, 1);
      return [...next, current];
    });
  }, []);

  // Selection is explicit — ensures owners don't trigger accidental filters
  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    const card = OWNER_INTENT_CARDS.find(c => c.id === id);
    if (card) onCardSelect(card);
  }, [onCardSelect]);

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
        key="owner-cyclic-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full flex-grow flex flex-col items-center pt-8 justify-center bg-transparent overflow-hidden"
        style={{
          minHeight: '620px', // Larger spec
        }}
      >
        <div
          className="relative"
          style={{
            width: PK_W,
            height: OWNER_PK_H,
          }}
        >
          {/* Deck rendered back-to-front so the first element sits on top */}
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
                isCollapsed={false}
                onCycle={handleCycle}
                onSelect={handleSelect}
                onBringToFront={handleBringToFront}
                cardHeight={OWNER_PK_H}
              />
            );
          })}
        </div>

        {/* Dynamic ambient backdrop shift based on top card */}
        <div className="absolute inset-x-0 bottom-0 top-1/2 pointer-events-none -z-10 bg-gradient-to-t from-black/5 to-transparent h-1/4" />
      </motion.div>
    </AnimatePresence>
  );
});

OwnerAllDashboard.displayName = 'OwnerAllDashboard';
