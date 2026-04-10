import { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

export const OwnerAllDashboard = memo(({ onCardSelect }: OwnerAllDashboardProps) => {
  const [cards, setCards] = useState([...OWNER_INTENT_CARDS]);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 🚀 SPEED OF LIGHT: Pre-fetch top card clients in background
  useEffect(() => {
    if (!user?.id || cards.length === 0) return;
    const topCard = cards[0];
    
    // Construct the filter key exactly as useSmartClientMatching does
    const tempFilters = {
      clientType: topCard.clientType || 'all',
      listingType: topCard.listingType || 'all',
      categories: [topCard.category || 'property']
    };
    const filtersKey = JSON.stringify(tempFilters);
    const category = topCard.category || 'property';

    // Pre-seed the query cache
    queryClient.prefetchQuery({
      queryKey: ['smart-clients', user.id, category, 0, false, filtersKey, false],
      staleTime: 2 * 60 * 1000,
    });
  }, [cards, user?.id, queryClient]);

  const handleCycle = useCallback((id: string, direction: 'left' | 'right') => {
    triggerHaptic('medium');
    setCards(prev => {
      if (prev[0].id !== id) return prev;
      const next = [...prev];
      const [current] = next.splice(0, 1);
      return [...next, current];
    });
  }, []);

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

  const cycleLeft = useCallback(() => {
    triggerHaptic('light');
    setCards(prev => {
      const next = [...prev];
      const [current] = next.splice(0, 1);
      return [...next, current];
    });
  }, []);

  const cycleRight = useCallback(() => {
    triggerHaptic('light');
    setCards(prev => {
      const next = [...prev];
      const last = next.pop()!;
      return [last, ...next];
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
        className="relative w-full flex-grow flex flex-col items-center justify-center bg-transparent overflow-hidden"
        style={{ minHeight: 'auto' }}
      >
        <div className="relative flex items-center justify-center gap-3">
          {/* External left arrow */}
          <button
            onClick={cycleLeft}
            className="swipe-hint-left z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm active:scale-90 transition-transform"
            aria-label="Previous filter"
          >
            <ChevronLeft size={20} className="text-white/60" />
          </button>

          {/* Card stack */}
          <div
            className="relative"
            style={{ width: `min(${PK_W}px, calc(100vw - 80px))`, height: `min(78dvh, ${OWNER_PK_H}px)`, maxHeight: '82vh' }}
          >
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

          {/* External right arrow */}
          <button
            onClick={cycleRight}
            className="swipe-hint-right z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm active:scale-90 transition-transform"
            aria-label="Next filter"
          >
            <ChevronRight size={20} className="text-white/60" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

OwnerAllDashboard.displayName = 'OwnerAllDashboard';
