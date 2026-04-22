import { useCallback, useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { QuickFilterBar } from '@/components/QuickFilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuickFilterCategory } from '@/types/filters';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ClientFilters from './ClientFilters';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useSmartListingMatching } from '@/hooks/smartMatching/useSmartListingMatching';
import { useAuth } from '@/hooks/useAuth';

const DiscoveryMapView = lazy(() => import('@/components/swipe/DiscoveryMapView'));

const DiscoveryMapLoading = lazy(() => import('@/components/swipe/DiscoveryMapLoading'));

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

// Client Dashboard (v1.0.96-rc3) — 3-phase UX flow:
// 1. Poker Cards (Dash Fan)
// 2. Discovery Map (Radar)
// 3. Swipe Deck (Container)
export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const { theme, isLight } = useAppTheme();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { user } = useAuth();
  const { setActiveCategory } = useFilterActions();

  // Phase state: 'cards' | 'map' | 'swipe'
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>(activeCategory ? 'map' : 'cards');
  const [selectedCategory, setSelectedCategory] = useState<QuickFilterCategory | null>(activeCategory as QuickFilterCategory);
  const [showFilters, setShowFilters] = useState(false);

  // 🚀 PERFORMANCE HYDRATION: Pre-fetch listing data while user is on map phase
  // so the swipe deck is ready instantly when they tap "Start Swiping".
  // We use useShallow to keep the filter object reference stable unless values change.
  const dashboardFilters = useFilterStore(useShallow(s => s.getListingFilters()));
  
  useSmartListingMatching(
    user?.id,
    [],
    dashboardFilters,
    0,
    20, // pageSize
    false // isRefreshMode (match container's initial state)
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
      setSelectedCategory(null);
    }
  }, [activeCategory, phase]);

  const handleLaunch = useCallback((category: QuickFilterCategory) => {
    setSelectedCategory(category);
    setActiveCategory(category);
    setPhase('map'); // Start with the radar map
  }, [setActiveCategory]);

  const handleMapBack = useCallback(() => {
    setPhase('cards');
    setSelectedCategory(null);
    setActiveCategory(null);
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
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center p-0 overflow-hidden relative",
      isLight ? "bg-white" : "bg-[#020202]"
    )}>
      {/* 🛸 Swipess ATMOSPHERIC LAYER (Forced for Discovery Phase) */}
      {!isLight && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-cyan-900/10 blur-[100px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {showCards && (
          <motion.div
            key="dash-fan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center w-full h-full overflow-hidden z-10"
            style={{ 
              paddingTop: 'calc(var(--top-bar-height) + var(--safe-top) + 20px)',
              paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom))',
              willChange: 'transform, opacity' 
            }}
          >
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <SwipeAllDashboard setCategories={(ids: any) => handleLaunch((Array.isArray(ids) ? ids[0] : ids) as QuickFilterCategory)} />
            </div>
          </motion.div>
        )}

        {showMap && selectedCategory && (
          <motion.div
            key={`map-${selectedCategory}`}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed inset-0 z-[10002] flex flex-col overflow-hidden backdrop-blur-2xl rounded-t-[3rem] shadow-[0_-20px_100px_rgba(0,0,0,0.3)]",
              isLight ? "bg-white/90" : "bg-black/90"
            )}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Apple Style Grabber */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-[10002]" />
            
            <Suspense fallback={<DiscoveryMapLoading isLight={isLight} />}>
              <DiscoveryMapView 
                category={selectedCategory} 
                onBack={handleMapBack}
                onStartSwiping={handleStartSwiping}
                onCategoryChange={(cat) => {
                  setSelectedCategory(cat);
                  setActiveCategory(cat);
                }}
              />
            </Suspense>
          </motion.div>
        )}

        {showSwipe && (
          <motion.div
            key="dash-swipe"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex flex-col z-10"
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
              "w-full h-full transition-all duration-500 rounded-t-[3.5rem] border-t overflow-y-auto shadow-2xl",
              isLight ? "bg-white/95 border-black/5" : "bg-black/95 border-white/10"
            )}>
               <div className="sticky top-0 z-[60] flex items-center justify-center pt-4 pb-2">
                  <div className={cn("w-12 h-1.5 rounded-full", isLight ? "bg-black/10" : "bg-white/20")} />
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
