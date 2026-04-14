// cache-bust: 2026-04-14
import { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  POKER_CARDS, PK_W, PK_H, POKER_CARD_PHOTOS,
} from './SwipeConstants';
import { PokerCategoryCard } from './PokerCategoryCard';
import { VapIdCardModal } from '../VapIdCardModal';

// Preload all card images on module load for instant display
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
  setCategories: (ids: any[]) => void;
}

export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const navigate = useNavigate();

  const [showVapModal, setShowVapModal] = useState(false);

  const handleCycle = useCallback((id: string, direction: 'left' | 'right') => {
    triggerHaptic('medium');
    uiSounds.playPing(0.8);
    setCards(prev => {
      if (prev[0].id !== id) return prev;
      const next = [...prev];
      const [current] = next.splice(0, 1);
      return [...next, current];
    });
  }, []);

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playPing(1.2);
    if (id === 'radio') {
      navigate('/radio');
    } else if (id === 'vap') {
      setShowVapModal(true);
    } else if (id === 'all') {
      // 'all' means show all categories — set to property as default entry
      setCategories(['property']);
    } else {
      setCategories([id]);
    }
  }, [setCategories, navigate]);

  const handleBringToFront = useCallback((index: number) => {
    triggerHaptic('light');
    uiSounds.playPop();
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
          className="swipe-hint-left z-10 flex items-center justify-center w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 backdrop-blur-sm active:scale-90 transition-transform"
          aria-label="Previous filter"
        >
          <ChevronLeft size={20} className="text-foreground/60" />
        </button>

        {/* Card stack — responsive height capped at PK_H */}
        <div
          className="relative"
          style={{ width: `min(${PK_W}px, calc(100vw - 80px))`, height: 'calc(100dvh - 190px)' }}
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
        </div>

        {/* External right arrow */}
        <button
          onClick={cycleRight}
          className="swipe-hint-right z-10 flex items-center justify-center w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 backdrop-blur-sm active:scale-90 transition-transform"
          aria-label="Next filter"
        >
          <ChevronRight size={20} className="text-foreground/60" />
        </button>
      </div>

      <VapIdCardModal 
        isOpen={showVapModal}
        onClose={() => setShowVapModal(false)}
      />
    </div>
  );
});

export default SwipeAllDashboard;
