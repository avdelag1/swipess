import { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronRight } from 'lucide-react';
import {
  OWNER_INTENT_CARDS,
  OwnerIntentCard,
  POKER_CARD_PHOTOS,
  PK_ASPECT,
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';

// Preload all owner card images
const preloadedOwnerImages = new Set<string>();

export interface OwnerAllDashboardProps {
  onCardSelect: (card: OwnerIntentCard) => void;
}

export const OwnerAllDashboard = memo(({ onCardSelect }: OwnerAllDashboardProps) => {
  const setOwnerPokerCardOrder = useFilterStore((s) => s.setOwnerPokerCardOrder);
  // Read persisted card order from localStorage directly
  const [cards, setCards] = useState(() => {
    try {
      const raw = localStorage.getItem('Swipess-filter-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        const order: string[] | null = parsed?.state?.ownerPokerCardOrder ?? null;
        if (order && order.length === OWNER_INTENT_CARDS.length) {
          const idToCard = new Map(OWNER_INTENT_CARDS.map((c) => [c.id, c]));
          const reordered = order.map((id) => idToCard.get(id)).filter(Boolean);
          if (reordered.length === OWNER_INTENT_CARDS.length) return reordered as typeof OWNER_INTENT_CARDS;
        }
      }
    } catch {}
    return [...OWNER_INTENT_CARDS];
  });
  const navigate = useNavigate();
  // Stable selector — avoids reading store inside click handler during a Suspense pass
  const openAIListing = useModalStore((s) => s.openAIListing);

  // Persist card order to store (zustand persist writes to localStorage)
  useEffect(() => {
    const ids = cards.map((c) => c.id);
    const stored = useFilterStore.getState().ownerPokerCardOrder;
    if (JSON.stringify(ids) !== JSON.stringify(stored)) {
      setOwnerPokerCardOrder(ids);
    }
  }, [cards, setOwnerPokerCardOrder]);

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
      if (direction === 'right') {
        const [current] = next.splice(0, 1);
        return [...next, current];
      } else {
        const last = next.pop()!;
        return [last, ...next];
      }
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
        className="relative h-full min-h-0 flex flex-col items-center justify-start bg-transparent"
        style={{ paddingTop: 'var(--top-bar-height, 72px)', paddingBottom: 'var(--bottom-nav-height, 80px)', boxSizing: 'border-box' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex-none flex items-center justify-center transition-all"
          style={{
            height: 'calc(100% - 24px)',
            width: 'calc((100dvh - var(--top-bar-height, 72px) - var(--bottom-nav-height, 80px) - 24px) * 0.66667)',
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
