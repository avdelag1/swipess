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
        {/* Ambient Tornasol / Sunset Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply blur-[100px] opacity-70"
            style={{ background: 'linear-gradient(to right, #fca5a5, #fcd34d)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, -50, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply blur-[100px] opacity-70"
            style={{ background: 'linear-gradient(to right, #c084fc, #f472b6)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply blur-[80px] opacity-50"
            style={{ background: 'linear-gradient(to right, #fb923c, #fbcfe8)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="relative z-10 flex-none flex items-center justify-center overflow-hidden rounded-[2.5rem]"
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

        <Suspense fallback={null}><VapIdCardModal
          isOpen={showVapModal}
          onClose={() => setShowVapModal(false)}
        /></Suspense>
      </motion.div>
    </AnimatePresence>
  );
});

export default SwipeAllDashboard;


