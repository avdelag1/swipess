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

interface ClientDashboardProps {
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
  const activeCategory = useFilterStore(s => s.activeCategory);
  const getListingFilters = useFilterStore(s => s.getListingFilters);
  const { user } = useAuth();
  const { setActiveCategory } = useFilterActions();

  const [phase, setPhase] = useState<'cards' | 'swipe'>(activeCategory ? 'swipe' : 'cards');
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
    if (!activeCategory && phase === 'swipe') {
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
    setPhase('swipe');
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
  const isSwiping = phase === 'swipe' || !!activeCategory;
  const showCards = !isSwiping;
  const showSwipe = isSwiping;

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

        {/* Map phase removed — redirected to swipe phase with radius HUD */}

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
