/**
 * RECYCLING CARD STACK
 *
 * High-performance card stack that REUSES DOM nodes instead of recreating them.
 * Critical insight: DOM creation/destruction is expensive. We keep 3 cards in DOM
 * and rotate data through them.
 *
 * Architecture:
 * - 3 fixed DOM nodes (Card0, Card1, Card2)
 * - Data rotates through cards on swipe
 * - Transform/opacity controlled via refs (no React re-render)
 * - Uses CSS containment for paint isolation
 */

import { useRef, useCallback, useEffect, memo, forwardRef, useImperativeHandle } from 'react';
import { SwipeEngine, SwipeEngineConfig } from './SwipeEngine';
import { imagePreloadController } from './ImagePreloadController';
import { swipeQueue } from './SwipeQueue';

export interface CardData {
  id: string;
  images: string[];
  [key: string]: any;
}

export interface RecyclingCardStackProps {
  cards: CardData[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right', cardData: CardData) => void;
  renderCard: (data: CardData, isTop: boolean, style: React.CSSProperties) => React.ReactNode;
  engineConfig?: Partial<SwipeEngineConfig>;
  className?: string;
}

export interface RecyclingCardStackHandle {
  triggerSwipe: (direction: 'left' | 'right') => void;
  reset: () => void;
}

interface CardSlot {
  ref: React.RefObject<HTMLDivElement>;
  dataIndex: number;
  isTop: boolean;
}

/**
 * Single card slot component - memoized to prevent re-renders
 */
const CardSlot = memo(forwardRef<
  HTMLDivElement,
  {
    data: CardData | null;
    isTop: boolean;
    zIndex: number;
    renderCard: RecyclingCardStackProps['renderCard'];
  }
>(({ data, isTop, zIndex, renderCard }, ref) => {
  if (!data) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex,
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: 'translateZ(0)',
    contain: 'paint layout',
  };

  return (
    <div
      ref={ref}
      style={style}
      data-card-id={data.id}
    >
      {renderCard(data, isTop, {})}
    </div>
  );
}));

CardSlot.displayName = 'CardSlot';

/**
 * Main recycling card stack component
 */
export const RecyclingCardStack = memo(forwardRef<
  RecyclingCardStackHandle,
  RecyclingCardStackProps
>(({ cards, currentIndex, onSwipe, renderCard, engineConfig, className }, ref) => {
  // Refs for the 3 card slots
  const card0Ref = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  // Track which slot is currently "top"
  const topSlotRef = useRef(0);
  const currentIndexRef = useRef(currentIndex);

  // Swipe engine
  const engineRef = useRef<SwipeEngine | null>(null);

  // Update currentIndex ref
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Initialize swipe engine
  useEffect(() => {
    const engine = new SwipeEngine({
      ...engineConfig,
      onSwipeLeft: () => handleSwipeComplete('left'),
      onSwipeRight: () => handleSwipeComplete('right'),
    });

    engineRef.current = engine;

    // Attach to current top card
    const topRef = getTopCardRef();
    if (topRef.current) {
      engine.attach(topRef.current);
    }

    return () => {
      engine.detach();
    };
  }, [engineConfig]);

  // Get ref for current top card
  const getTopCardRef = useCallback(() => {
    switch (topSlotRef.current) {
      case 0: return card0Ref;
      case 1: return card1Ref;
      case 2: return card2Ref;
      default: return card0Ref;
    }
  }, []);

  // Handle swipe completion - rotates data through slots
  // IMPORTANT: This is called AFTER the exit animation completes in SwipeEngine
  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    const idx = currentIndexRef.current;
    const cardData = cards[idx];

    if (cardData) {
      // Fire callback
      onSwipe(direction, cardData);

      // Queue backend write (fire-and-forget)
      swipeQueue.queueSwipe(cardData.id, direction, 'listing');
    }

    // Rotate slots: current top becomes invisible, next becomes top
    const currentTop = topSlotRef.current;
    const newTop = (currentTop + 1) % 3;
    topSlotRef.current = newTop;

    // CRITICAL: Detach engine FIRST to prevent any transform interference
    // Then wait a frame for React state to settle before resetting and reattaching
    // This prevents the "snap-back" glitch where reset() pulls the card back
    // while it's still visible during the DOM transition
    if (engineRef.current) {
      engineRef.current.detach();

      // Use requestAnimationFrame to wait for the next paint cycle
      // This ensures the slot rotation has been reflected in the DOM
      // before we reset the engine state and attach to the new card
      requestAnimationFrame(() => {
        if (engineRef.current) {
          engineRef.current.reset();
          const newTopRef = getTopCardRef();
          if (newTopRef.current) {
            engineRef.current.attach(newTopRef.current);
          }
        }
      });
    }

    // Preload ALL images from next cards in background
    const nextIdx = currentIndexRef.current + 1;

    // Preload ALL images from next card (high priority)
    if (cards[nextIdx]?.images) {
      cards[nextIdx].images.forEach((img: string) => {
        imagePreloadController.preload(img, 'high');
      });
    }

    // Preload ALL images from card after next (low priority)
    if (cards[nextIdx + 1]?.images) {
      cards[nextIdx + 1].images.forEach((img: string) => {
        imagePreloadController.preload(img, 'low');
      });
    }
  }, [cards, onSwipe, getTopCardRef]);

  // Imperative handle for parent control
  useImperativeHandle(ref, () => ({
    triggerSwipe: (direction: 'left' | 'right') => {
      engineRef.current?.triggerSwipe(direction);
    },
    reset: () => {
      engineRef.current?.reset();
    },
  }), []);

  // Preload ALL images from current and next cards on mount and index change
  useEffect(() => {
    const imagesToPreload: string[] = [];

    // Current card + next 2 cards - preload ALL images from each
    for (let i = 0; i < 3; i++) {
      const card = cards[currentIndex + i];
      if (card?.images) {
        // Add ALL images from this card
        card.images.forEach((img: string) => {
          if (img) {
            imagesToPreload.push(img);
          }
        });
      }
    }

    imagePreloadController.preloadBatch(imagesToPreload);
  }, [cards, currentIndex]);

  // Calculate which data goes to which slot
  // Slot 0, 1, 2 cycle based on topSlotRef
  const getSlotData = useCallback((slotIndex: number): CardData | null => {
    const offset = (slotIndex - topSlotRef.current + 3) % 3;
    const dataIndex = currentIndex + offset;
    return cards[dataIndex] || null;
  }, [cards, currentIndex]);

  const getSlotZIndex = useCallback((slotIndex: number): number => {
    const offset = (slotIndex - topSlotRef.current + 3) % 3;
    return 10 - offset; // Top has highest z-index
  }, []);

  const isSlotTop = useCallback((slotIndex: number): boolean => {
    return slotIndex === topSlotRef.current;
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        contain: 'layout paint',
        perspective: '1000px',
      }}
    >
      {/* 3 fixed card slots - never recreated */}
      <CardSlot
        ref={card0Ref}
        data={getSlotData(0)}
        isTop={isSlotTop(0)}
        zIndex={getSlotZIndex(0)}
        renderCard={renderCard}
      />
      <CardSlot
        ref={card1Ref}
        data={getSlotData(1)}
        isTop={isSlotTop(1)}
        zIndex={getSlotZIndex(1)}
        renderCard={renderCard}
      />
      <CardSlot
        ref={card2Ref}
        data={getSlotData(2)}
        isTop={isSlotTop(2)}
        zIndex={getSlotZIndex(2)}
        renderCard={renderCard}
      />
    </div>
  );
}));

RecyclingCardStack.displayName = 'RecyclingCardStack';
