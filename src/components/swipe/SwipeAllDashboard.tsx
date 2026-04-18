// cache-bust: 2026-04-14
import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  POKER_CARDS, PK_ASPECT, POKER_CARD_PHOTOS,
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

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();
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

  // Swipe left OR right just reorders the stack so the user can browse through the
  // category cards. Selection is ALWAYS done by tapping (or the Launch button) —
  // dragging must never navigate away from the dashboard.
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
      {/* Card stack — fluid dimensions via CSS vars; aspect ratio keeps the
          iOS-card proportions intact on every screen size. */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 'var(--card-width, 340px)',
          height: 'var(--card-height, 520px)',
          aspectRatio: `${PK_ASPECT}`,
          maxHeight: 'min(720px, calc(100svh - 180px))',
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
      </div>

      <VapIdCardModal 
        isOpen={showVapModal}
        onClose={() => setShowVapModal(false)}
      />
    </div>
  );
});

export default SwipeAllDashboard;
