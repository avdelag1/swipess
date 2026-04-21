// cache-bust: 2026-04-18-v14
import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import {
  POKER_CARDS, PK_ASPECT, POKER_CARD_PHOTOS,
} from './SwipeConstants';
import { PokerCategoryCard } from './PokerCategoryCard';
import { VapIdCardModal } from '../VapIdCardModal';
import { motion } from 'framer-motion';
import type { QuickFilterCategory } from '@/types/filters';

const preloadedImages = new Set<string>();
POKER_CARDS.forEach(card => {
  const src = POKER_CARD_PHOTOS[card.id];
  if (src && !preloadedImages.has(src)) {
    preloadedImages.add(src);
    const img = new Image();
    img.src = src;
  }
});

export interface SwipeAllDashboardProps {
  setCategories: (category: QuickFilterCategory) => void;
}

export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const navigate = useNavigate();
  const [showVapModal, setShowVapModal] = useState(false);

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();
    if (id === 'radio') navigate('/radio');
    else if (id === 'vap') setShowVapModal(true);
    else if (id === 'all') setCategories('property');
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  const handleCycle = useCallback((id: string, direction: 'left' | 'right') => {
    triggerHaptic('light');
    uiSounds.playCardSwipe(direction);
    setCards(prev => {
      if (prev[0].id !== id) return prev;
      const next = [...prev];
      if (direction === 'left') {
        const [front] = next.splice(0, 1);
        return [...next, front];
      }
      const last = next.pop()!;
      return [last, ...next];
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
    <div
      className="relative w-full flex-grow flex flex-col items-center justify-center bg-transparent overflow-hidden"
      style={{ minHeight: 'auto' }}
    >
      {/* 🛸 NEXUS CENTERED STACK v14.0 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center justify-center transition-all"
        style={{
          width: 'var(--card-width, 360px)',
          height: 'var(--card-height, 540px)',
          aspectRatio: `${PK_ASPECT}`,
          maxHeight: 'min(660px, calc(100svh - 220px))',
          // Removed manual translateY to bring it perfectly into the vertical middle
        }}
      >
      {[...cards].reverse().map((card, reversedIdx) => {
          const index = cards.length - 1 - reversedIdx;
          if (index > 3) return null;
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

      <VapIdCardModal 
        isOpen={showVapModal}
        onClose={() => setShowVapModal(false)}
      />
    </div>
  );
});

export default SwipeAllDashboard;
