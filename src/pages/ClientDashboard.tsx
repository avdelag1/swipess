import { useCallback, useState } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
}

/**
 * Client Dashboard — 3-phase UX flow:
 *   1. Poker card fan (category selection)
 *   2. Discovery Map (shows dots, set km radius)
 *   3. Swipe deck (full swipe experience)
 *
 * Back button in Discovery Map returns to phase 1.
 */

type DashboardPhase = 'cards' | 'map' | 'swipe';

export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
}: ClientDashboardProps) {
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setCategories, setActiveCategory } = useFilterActions();
  const { theme } = useTheme();

  // DASHBOARD PHASE: 'map' is now the primary discovery experience.
  // We default to 'property' category if nothing is selected yet.
  const [phase, setPhase] = useState<DashboardPhase>('map');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory>(activeCategory || 'property');

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  // When user selects a poker card → go to map.
  // Must clear activeCategory first: if a previous session left it set, the
  // showMap guard (!activeCategory) would be false and the map would never render.
  // When user selects a category (from cards or map chips) → update logic
  const handleCategorySelect = useCallback((ids: QuickFilterCategory[]) => {
    if (ids.length > 0) {
      const cat = ids[0];
      setMapCategory(cat);
      setPhase('map');
      // If we were swiping, we return to the map first to see new pins
      setActiveCategory(null);
    }
  }, [setActiveCategory]);

  // Map back → return to poker cards (optional secondary discovery)
  const handleMapBack = useCallback(() => {
    setPhase('cards');
    setActiveCategory(null);
  }, [setActiveCategory]);

  // Map "Start Swiping" → activate category and show deck
  const handleStartSwiping = useCallback(() => {
    setActiveCategory(mapCategory);
    setCategories([mapCategory]);
    triggerHaptic('medium');
    setPhase('swipe');
  }, [mapCategory, setCategories, setActiveCategory]);

  // Determine what to show based on phase + store state. 
  // We MUST be strictly exclusive to avoid "ghost designs" appearing behind.
  const isSwiping = phase === 'swipe' || !!activeCategory;
  const showCards = phase === 'cards' && !isSwiping;
  const showMap = phase === 'map' && !isSwiping;
  const showSwipe = isSwiping;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background relative">
      <AnimatePresence mode="popLayout">
        {showCards && (
          <motion.div
            key="dash-fan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            <SwipeAllDashboard setCategories={handleCategorySelect} />
          </motion.div>
        )}

        {showMap && mapCategory && (
          <motion.div
            key="dash-map"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
            style={{ willChange: 'transform, opacity' }}
          >
            <DiscoveryMapView
              category={mapCategory}
              onBack={handleMapBack}
              onStartSwiping={handleStartSwiping}
              onCategoryChange={(cat) => setMapCategory(cat)}
            />
          </motion.div>
        )}

        {showSwipe && (
          <motion.div
            key="dash-swipe"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
            style={{ willChange: 'transform, opacity' }}
          >
            <SwipessSwipeContainer
              onListingTap={handleListingTap}
              onInsights={handleListingTap}
              onMessageClick={onMessageClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
