// cache-bust: 2026-04-18-v14
import { memo, Suspense, useCallback, useEffect, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';

import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import {
  POKER_CARD_PHOTOS, UNIFIED_CARDS,
} from './SwipeConstants';
import { PokerCategoryCard } from './PokerCategoryCard';
const VapIdCardModal = lazyWithRetry(() => import('@/components/VapIdCardModal').then(m => ({ default: m.VapIdCardModal })));
import { AnimatePresence, motion } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';
import type { QuickFilterCategory } from '@/types/filters';
import { useFilterStore } from '@/state/filterStore';
import { useNavigate } from 'react-router-dom';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { EventsVideoQuickFilter } from './EventsVideoQuickFilter';

const preloadedImages = new Set<string>();

export interface SwipeAllDashboardProps {
  setCategories: (category: QuickFilterCategory) => void;
}

export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const navigate = useNavigate();
  const setPokerCardOrder = useFilterStore((s) => s.setPokerCardOrder);
  // Read persisted card order from localStorage directly (more reliable than
  // depending on zustand persist hydration timing for component re-mount).
  const [cards, setCards] = useState(() => {
    try {
      const raw = localStorage.getItem('Swipess-filter-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        const order: string[] | null = parsed?.state?.pokerCardOrder ?? null;
        if (order && order.length === UNIFIED_CARDS.length) {
          const idToCard = new Map(UNIFIED_CARDS.map((c) => [c.id, c]));
          const reordered = order.map((id) => idToCard.get(id)).filter(Boolean);
          if (reordered.length === UNIFIED_CARDS.length) return reordered as typeof UNIFIED_CARDS;
        }
      }
    } catch { /* localStorage parse failure — use default order */ }
    return [...UNIFIED_CARDS];
  });
  const [showVapModal, setShowVapModal] = useState(false);

  // Persist card order to store (zustand persist writes to localStorage)
  useEffect(() => {
    const ids = cards.map((c) => c.id);
    const stored = useFilterStore.getState().pokerCardOrder;
    if (JSON.stringify(ids) !== JSON.stringify(stored)) {
      setPokerCardOrder(ids);
    }
  }, [cards, setPokerCardOrder]);

  useEffect(() => {
    // Preload images safely on mount to prevent TDZ ReferenceErrors
    UNIFIED_CARDS.forEach(card => {
      const src = POKER_CARD_PHOTOS[card.id];
      if (src && !preloadedImages.has(src)) {
        preloadedImages.add(src);
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();
    if (id === 'vap') setShowVapModal(true);
    else if (id === 'events') navigate(EVENTS_FEED_PATH);
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  const handleCycle = useCallback((id: string, direction: 'left' | 'right') => {
    triggerHaptic('medium');
    uiSounds.playCardSwipe(direction);
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

  const handleBringToFront = useCallback((index: number) => {
    triggerHaptic('light');
    uiSounds.playPop();
    setCards(prev => {
      const next = [...prev];
      const [pulled] = next.splice(index, 1);
      return [pulled, ...next];
    });
  }, []);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="client-cyclic-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative h-full min-h-0 overflow-visible flex flex-col items-center justify-start bg-white"
        style={{
          paddingTop: 'calc(var(--top-bar-height, 72px) + var(--safe-top, 0px))',
          paddingBottom: 'calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
      >
        {/* Lightweight Ambient Tornasol / Sunset Background */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-40"
          style={{
            background: 'linear-gradient(120deg, #fca5a5 0%, #fcd34d 33%, #fb923c 66%, #c084fc 100%)',
            backgroundSize: '300% 300%',
            animation: 'tornasol-move 15s ease infinite',
          }}
        >
          <style>{`
            @keyframes tornasol-move {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="relative z-10 flex-none flex flex-row items-center justify-center w-full px-3 gap-3 overflow-visible"
          style={{
            height: 'calc(100% - 24px)',
            maxWidth: '600px',
          }}
        >
          {/* Left Side: Events Video Carousel (Larger) */}
          <div className="flex-[0.55] h-full relative" style={{ maxHeight: '80dvh' }}>
             <EventsVideoQuickFilter />
          </div>

          {/* Right Side: Poker Stack (Smaller) */}
          <div 
             className="flex-[0.45] relative flex items-center justify-center overflow-visible"
             style={{
                height: 'calc(100% - 40px)', // Slightly shorter to emphasize Events size
                maxHeight: '75dvh',
             }}
          >
            <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '520 / 780' }}>
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
          </div>
        </motion.div>

        <Suspense fallback={null}><VapIdCardModal
          isOpen={showVapModal}
          onClose={() => setShowVapModal(false)}
        /></Suspense>
      </motion.div>
    </AnimatePresence>
  );
});

export default SwipeAllDashboard;


