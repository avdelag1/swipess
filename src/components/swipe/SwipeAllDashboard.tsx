import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  POKER_CARDS, PK_W, PK_H,
} from './SwipeConstants';
import { PokerCategoryCard } from './PokerCategoryCard';

export interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const navigate = useNavigate();

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
    <div
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
          style={{ width: PK_W, height: PK_H }}
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

        {/* External right arrow */}
        <button
          onClick={cycleRight}
          className="swipe-hint-right z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm active:scale-90 transition-transform"
          aria-label="Next filter"
        >
          <ChevronRight size={20} className="text-white/60" />
        </button>
      </div>
    </div>
  );
});

export default SwipeAllDashboard;
