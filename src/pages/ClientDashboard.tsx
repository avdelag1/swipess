import { useCallback, useState, useEffect } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuickFilterCategory } from '@/types/filters';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ClientFilters from './ClientFilters';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

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
  // Phase state: 'map' | 'swipe' (Removed 'cards' phase forever)
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>(activeCategory ? 'swipe' : 'cards');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory>('property');
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory, setCategories } = useFilterActions();

  // ─── Actions ─────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const handleOpenFilters = () => setShowFilters(true);
    window.addEventListener('open-client-filters', handleOpenFilters);
    return () => window.removeEventListener('open-client-filters', handleOpenFilters);
  }, []);
  
  const handleLaunch = useCallback((category: QuickFilterCategory) => {
    setActiveCategory(null);
    setMapCategory(category);
    setPhase('map'); 
    setCategories([category]);
  }, [setCategories, setActiveCategory]);

  const handleExhaustedMap = useCallback(() => {
    setPhase('map');
  }, []);

  const handleStartSwiping = useCallback(() => {
    if (mapCategory) {
      setActiveCategory(mapCategory);
      setPhase('swipe');
    }
  }, [mapCategory, setActiveCategory]);

  const handleListingTap = useCallback(() => {
    handleStartSwiping();
  }, [handleStartSwiping]);

  // Determine what to show strictly
  const isSwiping = phase === 'swipe' || !!activeCategory;
  const showMap = phase === 'map' && !isSwiping;
  const showSwipe = isSwiping;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      <AnimatePresence mode="popLayout">
        {phase === 'cards' && !activeCategory && (
          <motion.div
            key="dash-cards"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full relative"
          >
            <SwipeAllDashboard onSelectCard={(card) => handleLaunch(card.id as QuickFilterCategory)} />
          </motion.div>
        )}

        {showSwipe && (
          <motion.div
            key="dash-swipe"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
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
