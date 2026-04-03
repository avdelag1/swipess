import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARDS, PK_W, PK_H,
} from './SwipeConstants';
import { PokerCategoryCard } from './PokerCategoryCard';

export interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

/**
 * 🃏 SwipeAllDashboard — CYCLIC REBORN 🎰
 */
export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const navigate = useNavigate();

  // Faster, more physical cycle: instantaneous array rotation
  const handleCycle = useCallback((id: string, direction: 'left' | 'right') => {
    // Instant Haptic Feedback on the 'Blink' of interaction
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
    if (id === 'radio') {
      navigate('/radio');
    } else {
      setCategories([id]);
    }
  }, [setCategories, navigate]);

  const handleBringToFront = useCallback((index: number) => {
    triggerHaptic('light');
    setCards(prev => {
      const next = [...prev];
      const [pulled] = next.splice(index, 1);
      return [pulled, ...next];
    });
  }, []);

  return (
    <div
      className="relative w-full flex-grow flex flex-col items-center pt-12 pb-24 justify-center bg-transparent overflow-hidden"
      style={{
        minHeight: '700px', // Extended for 'Larger' card spec and depth visibility
      }}
    >
      {/* 🚀 ZENITH DEPTH SYSTEM: Cards stack vertically with a deep perspective shift */}
      <div
        className="relative"
        style={{
          width: PK_W,
          height: PK_H,
        }}
      >
        {/* Render back-to-front explicitly */}
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

      {/* Atmospheric bottom shadow to anchor the deck */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none -z-10 bg-gradient-to-t from-black/10 to-transparent h-[40%]" />
    </div>
  );
});

export default SwipeAllDashboard;
