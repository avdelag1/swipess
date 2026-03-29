import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  POKER_CARDS, PK_W, PK_H, FOLDER_OFFSET_X, FOLDER_OFFSET_Y
} from './SwipeConstants';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { PokerCategoryCard } from './PokerCategoryCard';

import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { DistanceSlider } from './DistanceSlider';
import { QuickFilterBar } from '../QuickFilterBar';
import type { QuickFilters } from '@/types/filters';

export interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

/**
 * SwipeAllDashboard - The "All" dashboard shown when no specific category is selected.
 * Presents a fanned-out deck of categories for the user to choose from.
 * Every 15s the hand folds shut then fans back open.
 */
export const SwipeAllDashboard = ({ setCategories }: SwipeAllDashboardProps) => {
  const [cards, setCards] = useState([...POKER_CARDS]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { radiusKm, setRadiusKm } = useFilterStore(
    useShallow((state) => ({
      radiusKm: state.radiusKm,
      setRadiusKm: state.setRadiusKm,
    }))
  );



  // Periodic fold → open cycle every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsCollapsed(true);
      openTimerRef.current = setTimeout(() => setIsCollapsed(false), 1600);
    }, 15000);
    return () => {
      clearInterval(interval);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  // Swipe out front card: apply filter
  const handleSwipeOut = useCallback((id: string) => {
    triggerHaptic('medium');
    setCategories([id]);
  }, [setCategories]);

  // Bring a back card to the front (tap or short drag)
  const handleBringToFront = useCallback((index: number) => {
    triggerHaptic('light');
    setCards(prev => {
      const next = [...prev];
      const [pulled] = next.splice(index, 1);
      return [pulled, ...next];
    });
  }, []);

  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRadiusKm(50); // reset to default on fresh detect
        setLocationDetected(true);
        setLocationDetecting(false);
      },
      () => {
        setLocationDetecting(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const N = cards.length;
  // Container is sized to show the full front card plus the peeking strips of back cards
  const _containerW = PK_W + (N - 1) * FOLDER_OFFSET_X;
  const _containerH = PK_H + (N - 1) * FOLDER_OFFSET_Y;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="folder-dashboard"
        variants={deckFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full flex-grow flex flex-col items-center justify-start bg-background overflow-hidden"
        style={{
          minHeight: '100dvh',
          paddingTop: 'calc(64px + var(--safe-top))',
          paddingBottom: 'calc(68px + var(--safe-bottom))',
        }}
      >
        {/* PREMIUM: Little Bowl Distance Selector — Floating at Top */}
        <div className="w-full max-w-sm mt-4 mb-4 px-4 stagger-enter">
          <DistanceSlider
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            onDetectLocation={detectLocation}
            detecting={locationDetecting}
            detected={locationDetected}
          />
        </div>

        {/* Global Quick Filter Bar — Compact Horizontal Version */}
        <div className="w-full mb-8 stagger-enter">
          <QuickFilterBar
            filters={{
              categories: [],
              listingType: 'both',
              clientGender: 'any',
              clientType: 'all',
            }}
            onChange={(newFilters: Partial<QuickFilters>) => {
              if (newFilters.categories?.length) {
                setCategories(newFilters.categories as any);
              }
            }}
            className="rounded-3xl shadow-xl border border-white/5 bg-background/40 backdrop-blur-md"
          />
        </div>

        {/* Folder card stack — symmetrical fanned-out flow */}
        <div
          className="relative stagger-enter mt-4"
          style={{
            width: PK_W,
            height: PK_H,
          }}
        >
          {/* Render back-to-front so the front card sits on top */}
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
                isCollapsed={isCollapsed}
                onSwipeOut={handleSwipeOut}
                onBringToFront={handleBringToFront}
              />
            );
          })}
        </div>

        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.05] blur-[100px] bg-primary animate-pulse-slow" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
