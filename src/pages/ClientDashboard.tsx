import { useCallback, useState, useEffect } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';
import { DashboardMapCard } from '@/components/swipe/DashboardMapCard';
import { MapFilterChipRow } from '@/components/swipe/MapFilterChipRow';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuickFilterCategory } from '@/types/filters';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ClientFilters from './ClientFilters';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useModalStore } from '@/state/modalStore';

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
  const { theme } = useTheme();
  // Phase state: 'cards' | 'map' | 'swipe'.
  // Default landing = map (replaces the legacy "ENGAGE DISCOVERY" intro).
  // 'cards' remains reachable when the user re-taps Dashboard in the bottom nav,
  // which clears activeCategory and triggers the cards fallback via useEffect.
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>('map');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory | null>('property');
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory } = useFilterActions();

  // ─── Actions ─────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const handleOpenFilters = () => setShowFilters(true);
    window.addEventListener('open-client-filters', handleOpenFilters);
    return () => window.removeEventListener('open-client-filters', handleOpenFilters);
  }, []);

  // 🛰️ DISCOVERY SYNC: If active category is cleared elsewhere (e.g. via 'Back' button in container), 
  // revert phase to 'cards' to show the Poker Fan.
  useEffect(() => {
    if (!activeCategory && phase === 'swipe') {
      setPhase('cards');
    }
  }, [activeCategory, phase]);
  
  const setModal = useModalStore(s => s.setModal);

  // 🌍 FULLSCREEN MAP ENGINE: Control global HUD visibility based on dash phase
  useEffect(() => {
    setModal('showMapFullscreen', phase === 'map');
    return () => setModal('showMapFullscreen', false);
  }, [phase, setModal]);

  const handleLaunch = useCallback((category: QuickFilterCategory) => {
    setMapCategory(category);
    setPhase('map');
    setActiveCategory(null);
  }, [setActiveCategory]);

  const handleExhaustedMap = useCallback(() => {
    setPhase('map');
  }, []);

  const handleMapBack = useCallback(() => {
    setActiveCategory(null);
    setPhase('cards');
    setMapCategory(null);
  }, [setActiveCategory]);

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

  // Determine what to show based on phase + store state. 
  // We MUST be strictly exclusive to avoid "ghost designs" appearing behind.
  const isSwiping = phase === 'swipe' || !!activeCategory;
  const showCards = phase === 'cards' && !isSwiping;
  const showMap = phase === 'map' && !isSwiping;
  const showSwipe = isSwiping;

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden relative", theme === 'light' || theme === 'ivanna-style' ? 'bg-white' : 'bg-black')}>
      <AnimatePresence mode="wait">
        {showCards && (
          <motion.div
            key="dash-fan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center h-full w-full overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            <SwipeAllDashboard setCategories={(ids: any) => handleLaunch((Array.isArray(ids) ? ids[0] : ids) as QuickFilterCategory)} />
          </motion.div>
        )}

        {showMap && mapCategory && (
          <motion.div
            key="dash-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn("flex-1 w-full h-full flex flex-col items-stretch overflow-hidden", theme === 'light' || theme === 'ivanna-style' ? 'bg-white' : 'bg-black')}
          >
            <DashboardMapCard className="flex-1 h-full w-full">
              <MapFilterChipRow mode="client" onBack={handleMapBack} />
              <div className="flex-1 relative w-full h-full min-h-0">
                <DiscoveryMapView
                  category={mapCategory}
                  onBack={handleMapBack}
                  onStartSwiping={handleStartSwiping}
                  isEmbedded={true}
                  mode="client"
                />
              </div>
            </DashboardMapCard>
          </motion.div>
        )}

        {showSwipe && (
          <motion.div
            key="dash-swipe"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex flex-col"
            style={{ willChange: 'transform, opacity' }}
          >
            <SwipessSwipeContainer
              onListingTap={handleListingTap}
              onExhaustedMap={handleExhaustedMap}
              onInsights={handleListingTap}
              onMessageClick={onMessageClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="bottom" className="h-[92vh] p-0 border-none bg-transparent overflow-hidden">
            <div className={cn(
              "w-full h-full transition-all duration-500 rounded-t-[3.5rem] border-t overflow-y-auto",
              theme === 'nexus-style' ? "bg-black/90 border-white/10" : 
              (theme === 'ivanna-style' ? "bg-card border-foreground/30 shadow-artisan" : "glass-morphism border-white/10")
            )}>
               <div className="sticky top-0 z-[60] flex items-center justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
               </div>
               <div className="px-1 pb-20">
                  <ClientFilters isEmbedded={true} onClose={() => setShowFilters(false)} />
               </div>
            </div>
         </SheetContent>
      </Sheet>
    </div>
  );
}
