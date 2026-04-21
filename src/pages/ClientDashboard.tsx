import { useCallback, useState, useEffect } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuickFilterCategory } from '@/types/filters';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ClientFilters from './ClientFilters';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useModalStore } from '@/state/modalStore';
import { useSmartListingMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

// Client Dashboard (v1.0.96-rc2) — 3-phase UX flow:
// 1. Poker Cards (Dash Fan)
// 2. Discovery Map (Radar)
// 3. Swipe Deck (Container)
export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const { theme, isLight } = useTheme();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const getListingFilters = useFilterStore(s => s.getListingFilters);
  const { user } = useAuth();
  const { setActiveCategory } = useFilterActions();

  // If we have an active category but we're NOT in swipe phase, we're on the map.
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>(activeCategory ? 'map' : 'cards');
  const [selectedCategory, setSelectedCategory] = useState<QuickFilterCategory | null>(activeCategory);
  const [showFilters, setShowFilters] = useState(false);

  // 🚀 PERFORMANCE HYDRATION: Pre-fetch listing data while user is on map phase
  // so the swipe deck is ready instantly when they tap "Start Swiping".
  useSmartListingMatching(
    user?.id,
    [],
    getListingFilters(),
    0,
    20,
    !!activeCategory // Cast to boolean for isRefreshMode
  );

  // ─── Actions ─────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const handleOpenFilters = () => setShowFilters(true);
    window.addEventListener('open-client-filters', handleOpenFilters);
    return () => window.removeEventListener('open-client-filters', handleOpenFilters);
  }, []);

  // 🛰️ DISCOVERY SYNC: If active category is cleared elsewhere (e.g. via 'Back' button in container), 
  // revert phase to 'cards' to show the Poker Fan.
  useEffect(() => {
    if (!activeCategory && (phase === 'map' || phase === 'swipe')) {
      setPhase('cards');
    }
  }, [activeCategory, phase]);
  
  const setModal = useModalStore(s => s.setModal);

  useEffect(() => {
    // Modal cleanup on mount
  }, []);

  const handleLaunch = useCallback((category: QuickFilterCategory) => {
    setSelectedCategory(category);
    setActiveCategory(category);
    setPhase('map'); // Start with the radar map
  }, [setActiveCategory]);


  const handleMapBack = useCallback(() => {
    setActiveCategory(null);
    setPhase('cards');
    setSelectedCategory(null);
  }, [setActiveCategory]);

  const handleStartSwiping = useCallback(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
      setPhase('swipe');
    }
  }, [selectedCategory, setActiveCategory]);

  const handleListingTap = useCallback(() => {
    // In v1.0, tapping the mini-card on map takes you to swipe phase
    handleStartSwiping();
  }, [handleStartSwiping]);

  // Determine what to show based on phase + store state. 
  // We MUST be strictly exclusive to avoid "ghost designs" appearing behind.
  const showCards = phase === 'cards' && !activeCategory;
  const showMap = phase === 'map' && !!activeCategory;
  const showSwipe = phase === 'swipe' && !!activeCategory;

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden relative bg-transparent")}>
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

        {showMap && selectedCategory && (
          <motion.div
            key={`map-${selectedCategory}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[50] flex flex-col overflow-hidden bg-background"
            style={{ willChange: 'transform, opacity' }}
          >
            <DiscoveryMapView 
              category={selectedCategory} 
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
            className="w-full h-full flex flex-col"
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

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="bottom" className="h-[92vh] p-0 border-none bg-transparent overflow-hidden">
            <div className={cn(
              "w-full h-full transition-all duration-500 rounded-t-[3.5rem] border-t overflow-y-auto",
              isLight ? "bg-white/75 backdrop-blur-[40px] saturate-[180%] border-none shadow-[0_-20px_60px_rgba(0,0,0,0.1),inset_0_0_0_1.5px_rgba(255,255,255,0.8)]" : 
              "bg-black/65 backdrop-blur-[40px] saturate-[180%] border-none shadow-[0_-40px_100px_rgba(0,0,0,0.8),inset_0_0_0_1.5px_rgba(255,255,255,0.15)]"
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
