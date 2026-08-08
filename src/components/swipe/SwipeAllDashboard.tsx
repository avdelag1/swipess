// cache-bust: 2026-08-08-depth-v1
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
import useAppTheme from '@/hooks/useAppTheme';

const preloadedImages = new Set<string>();

export interface SwipeAllDashboardProps {
  setCategories: (category: QuickFilterCategory) => void;
}

export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const navigate = useNavigate();
  const { isLight } = useAppTheme();
  const setPokerCardOrder = useFilterStore((s) => s.setPokerCardOrder);
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

  useEffect(() => {
    const ids = cards.map((c) => c.id);
    const stored = useFilterStore.getState().pokerCardOrder;
    if (JSON.stringify(ids) !== JSON.stringify(stored)) {
      setPokerCardOrder(ids);
    }
  }, [cards, setPokerCardOrder]);

  useEffect(() => {
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
        className="relative h-full min-h-0 overflow-visible flex flex-col items-center justify-start"
        style={{
          background: 'var(--dash-bg, hsl(var(--background)))',
          paddingTop: 'calc(var(--top-bar-height, 72px) + var(--safe-top, 0px))',
          paddingBottom: 'calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
      >
        {/* Soft tonal well behind cards — no sunset / animated color wash */}
        <div
          aria-hidden
          className="absolute inset-x-4 top-[18%] bottom-[16%] rounded-[2.5rem] pointer-events-none"
          style={{
            background: isLight ? 'var(--dash-well, #E8E8EE)' : 'var(--dash-well, #101014)',
            opacity: 0.9,
          }}
        />

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
          <div className="flex-[0.55] h-full relative" style={{ maxHeight: '80dvh' }}>
             <EventsVideoQuickFilter />
          </div>

          <div
             className="flex-[0.45] relative flex items-center justify-center overflow-visible"
             style={{
                height: 'calc(100% - 40px)',
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
