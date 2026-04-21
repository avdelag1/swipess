import { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  OWNER_INTENT_CARDS,
  OwnerIntentCard,
  PK_W,
  PK_H,
  OWNER_PK_H,
  PK_ASPECT,
  POKER_CARD_PHOTOS,
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';

// Preload all owner card images
const preloadedOwnerImages = new Set<string>();

export interface OwnerAllDashboardProps {
  onCardSelect: (card: OwnerIntentCard) => void;
}

export const OwnerAllDashboard = memo(({ onCardSelect }: OwnerAllDashboardProps) => {
  const [cards, setCards] = useState([...OWNER_INTENT_CARDS]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Preload all owner card images safely on mount to prevent TDZ ReferenceError
    OWNER_INTENT_CARDS.forEach(card => {
      const src = POKER_CARD_PHOTOS[card.id];
      if (src && !preloadedOwnerImages.has(src)) {
        preloadedOwnerImages.add(src);
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  // 🚀 SPEED OF LIGHT: Pre-fetch top card clients in background
  useEffect(() => {
    if (!user?.id || cards.length === 0) return;
    const topCard = cards[0];
    
    const tempFilters = {
      clientType: topCard.clientType || 'all',
      listingType: topCard.listingType || 'all',
      categories: [topCard.category || 'property']
    };
    const filtersKey = JSON.stringify(tempFilters);
    const category = topCard.category || 'property';

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
    if (id === 'lawyer') {
      navigate('/legal');
      return;
    }
    if (id === 'promote') {
      navigate('/promote');
      return;
    }
    const card = OWNER_INTENT_CARDS.find(c => c.id === id);
    if (card) onCardSelect(card);
  }, [onCardSelect, navigate]);

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
        {/* Card stack — same responsive sizing as client */}
        <div
          className="relative flex items-center justify-center transition-all"
          style={{ 
            height: 'min(75svh, 540px)',
            width: `calc(min(75svh, 540px) * ${PK_ASPECT})`,
            padding: '0.4rem',
          }}
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
              />
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

OwnerAllDashboard.displayName = 'OwnerAllDashboard';


