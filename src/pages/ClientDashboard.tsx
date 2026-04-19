import { useCallback, useState } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';
import { motion, AnimatePresence } from 'framer-motion';
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
 * We maintain a strict 'phase' state here to ensure perfect 
 * UI transitions and state isolation.
 */
export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  // Phase state: 'cards' | 'map' | 'swipe'
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>('cards');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory | null>(null);

  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory } = useFilterActions();

  // ─── Actions ─────────────────────────────────────────────────────────────
  
  const handleLaunch = useCallback((category: QuickFilterCategory) => {
    setMapCategory(category);
    setPhase('map');
  }, []);

  const handleMapBack = useCallback(() => {
    setPhase('cards');
    setMapCategory(null);
  }, []);

  const handleStartSwiping = useCallback(() => {
    if (mapCategory) {
      setActiveCategory(mapCategory);
      setPhase('swipe');
    }
  }, [mapCategory, setActiveCategory]);

  const handleListingTap = useCallback(() => {
    // In v1.0, tapping the mini-card on map takes you to swipe phase
    handleStartSwiping();
  }, [handleStartSwiping]);

  // Handle case where user exits swipe deck via some other nav
  const handleBackToMap = useCallback(() => {
    setActiveCategory(null);
    setPhase('map');
  }, [setActiveCategory]);


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
            <SwipeAllDashboard setCategories={handleLaunch as any} />
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
              isEmbedded={false}
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
