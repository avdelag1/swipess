import { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  OWNER_INTENT_CARDS,
  OwnerIntentCard,
  POKER_CARD_PHOTOS,
  PK_ASPECT,
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';
import { useModalStore } from '@/state/modalStore';

// Preload all owner card images
const preloadedOwnerImages = new Set<string>();

export interface OwnerAllDashboardProps {
  onCardSelect: (card: OwnerIntentCard) => void;
}

export const OwnerAllDashboard = memo(({ onCardSelect }: OwnerAllDashboardProps) => {
  const [cards, setCards] = useState([...OWNER_INTENT_CARDS]);
  const navigate = useNavigate();
  // Stable selector — avoids reading store inside click handler during a Suspense pass
  const openAIListing = useModalStore((s) => s.openAIListing);

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

  // NOTE: Pre-fetch removed — queryClient.prefetchQuery without queryFn causes React Query errors.
  // The actual data fetch is handled by useSmartClientMatching when the user picks a card.

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
      navigate('/client/advertise');
      return;
    }
    if (id === 'ai-listing') {
      openAIListing();
      return;
    }
    if (id === 'radio') {
      navigate('/radio');
      return;
    }
    const card = OWNER_INTENT_CARDS.find(c => c.id === id);
    if (card) onCardSelect(card);
  }, [onCardSelect, navigate, openAIListing]);

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
        className="relative flex-1 flex flex-col items-center justify-start bg-transparent"
        style={{ paddingTop: '4px', paddingBottom: 'var(--bottom-nav-height, 80px)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex-none flex items-center justify-center transition-all"
          style={{
            height: 'calc(100dvh - var(--top-bar-height, 72px) - var(--bottom-nav-height, 80px) - 8px)',
            width: 'calc((100dvh - var(--top-bar-height, 72px) - var(--bottom-nav-height, 80px) - 8px) * 0.66667)',
            maxWidth: '100%',
            aspectRatio: '520 / 780',
            flex: 'none'
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

OwnerAllDashboard.displayName = 'OwnerAllDashboard';
