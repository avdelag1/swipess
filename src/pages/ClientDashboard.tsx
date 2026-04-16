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

  // Track dashboard phase locally for smooth transitions
  const [phase, setPhase] = useState<DashboardPhase>(activeCategory ? 'swipe' : 'cards');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory | null>(null);

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  // When user selects a poker card → go to map.
  // Must clear activeCategory first: if a previous session left it set, the
  // showMap guard (!activeCategory) would be false and the map would never render.
  const handleCategorySelect = useCallback((ids: QuickFilterCategory[]) => {
    if (ids.length > 0) {
      const cat = ids[0];
      setActiveCategory(null);
      setMapCategory(cat);
      setPhase('map');
    }
  }, [setActiveCategory]);

  // Map back → return to poker cards
  const handleMapBack = useCallback(() => {
    setMapCategory(null);
    setPhase('cards');
    // Clear any active category so swipe container doesn't show
    setActiveCategory(null);
  }, [setActiveCategory]);

  // Map "Start Swiping" → activate category and show deck
  const handleStartSwiping = useCallback(() => {
    if (mapCategory) {
      setCategories([mapCategory]);
      setPhase('swipe');
    }
  }, [mapCategory, setCategories]);

  // Determine what to show based on phase + store state
  const showCards = phase === 'cards' && !activeCategory;
  const showMap = phase === 'map' && mapCategory && !activeCategory;
  const showSwipe = phase === 'swipe' || !!activeCategory;

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
