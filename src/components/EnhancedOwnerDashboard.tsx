import { useState, useEffect, useRef, memo, useMemo, lazy, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
const _ClientInsightsDialog = lazy(() =>
  import('@/components/ClientInsightsDialog').then(m => ({ default: m.ClientInsightsDialog }))
);
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { Cpu, Activity } from 'lucide-react';
import { useModalStore } from '@/state/modalStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { ClientFilters } from '@/hooks/useSmartMatching';
import { OwnerInsightsDashboard } from '@/components/OwnerInsightsDashboard';
import { OwnerAllDashboard } from '@/components/swipe/OwnerAllDashboard';
import { useFilterActions } from '@/state/filterStore';
import type { OwnerIntentCard } from '@/components/swipe/SwipeConstants';
import { triggerHaptic } from '@/utils/haptics';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';
import { DashboardMapCard } from '@/components/swipe/DashboardMapCard';
import { MapFilterChipRow } from '@/components/swipe/MapFilterChipRow';
import type { QuickFilterCategory } from '@/types/filters';
import { useTheme } from '@/hooks/useTheme';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; 
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [viewMode] = useState<'discovery' | 'insights'>('discovery');
  
  useEffect(() => {
    const handleOpenFilters = () => setShowFilters(true);
    window.addEventListener('open-owner-filters', handleOpenFilters);
    return () => window.removeEventListener('open-owner-filters', handleOpenFilters);
  }, []);
  
  const activeCategory = useFilterStore(s => s.activeCategory);
  // Default landing = map (replaces the legacy "ENGAGE DISCOVERY" intro).
  // 'cards' is still reachable when activeCategory clears (bottom-nav re-tap).
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>(activeCategory ? 'swipe' : 'map');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory | null>('property');
  const [showFilters, setShowFilters] = useState(false);

  const { setModal } = useModalStore();

  // 🌍 FULLSCREEN MAP ENGINE: Control global HUD visibility based on dash phase
  useEffect(() => {
    setModal('showMapFullscreen', phase === 'map');
    return () => setModal('showMapFullscreen', false);
  }, [phase, setModal]);

  const { user, loading: isAuthLoading } = useAuth();
  const { navigate } = useAppNavigate();

  const { setCategories, setClientType, setListingType, setActiveCategory } = useFilterActions();

  // Hydrate owner filter store from DB on mount
  const { preferences: ownerPrefs, isLoading: isPrefsLoading } = useOwnerClientPreferences();
  const { setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities, storeGender } = useFilterStore(
    useShallow((s) => ({
      setClientGender: s.setClientGender,
      setClientAgeRange: s.setClientAgeRange,
      setClientBudgetRange: s.setClientBudgetRange,
      setClientNationalities: s.setClientNationalities,
      storeGender: s.clientGender,
    }))
  );
  const hydratedRef = useRef(false);

  // 🛰️ DISCOVERY SYNC: If active category is cleared elsewhere, revert phase to 'cards'
  useEffect(() => {
    if (!activeCategory && phase === 'swipe') {
      setPhase('cards');
    }
  }, [activeCategory, phase]);

  useEffect(() => {
    if (!ownerPrefs || hydratedRef.current) return;
    hydratedRef.current = true;

    const genders = ownerPrefs.selected_genders as string[] | null;
    const nationalities = ownerPrefs.preferred_nationalities as string[] | null;

    if (storeGender === 'any' && genders?.length) {
      setClientGender(genders[0] as any);
    }
    if (ownerPrefs.min_age != null || ownerPrefs.max_age != null) {
      setClientAgeRange([ownerPrefs.min_age ?? 18, ownerPrefs.max_age ?? 65]);
    }
    if (ownerPrefs.min_budget != null || ownerPrefs.max_budget != null) {
      setClientBudgetRange([ownerPrefs.min_budget ?? 0, ownerPrefs.max_budget ?? 50000]);
    }
    if (nationalities?.length) {
      setClientNationalities(nationalities);
    }
  }, [ownerPrefs, storeGender, setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities]);

  const storeFilterVersion = useFilterStore((s) => s.filterVersion);
  const clientFilters = useMemo(() => {
    return useFilterStore.getState().getClientFilters();
  }, [storeFilterVersion]);

  const mergedFilters = useMemo(() => {
    return { ...filters, ...clientFilters };
  }, [filters, clientFilters]);

  const filterCategory = mergedFilters?.categories?.[0] || undefined;
  const { data: clientProfiles = [], isLoading, error } = useSmartClientMatching(
    user?.id,
    filterCategory,
    0,
    50,
    false,
    mergedFilters as ClientFilters
  );

  const handleClientTap = useCallback((clientId: string) => {
    onClientInsights?.(clientId);
  }, [onClientInsights]);

  const handleInsights = useCallback((clientId: string) => {
    onClientInsights?.(clientId);
  }, [onClientInsights]);

  const handleCardSelect = useCallback((card: OwnerIntentCard) => {
    triggerHaptic('medium');
    const cat = (card.category || 'property') as QuickFilterCategory;
    
    // Set map context first instead of jumping to swipe deck
    setMapCategory(cat);
    setPhase('map');
    setActiveCategory(null);
    
    if (card.clientType) setClientType(card.clientType as any);
    if (card.listingType) setListingType(card.listingType as any);
  }, [setClientType, setListingType, setActiveCategory]);

  const handleExhaustedMap = useCallback(() => {
    setPhase('map');
  }, []);

  const handleMapBack = useCallback(() => {
    setMapCategory(null);
    setPhase('cards');
    setActiveCategory(null);
  }, [setActiveCategory]);

  const handleStartSwiping = useCallback(() => {
    if (mapCategory) {
      setCategories([mapCategory]);
      setActiveCategory(mapCategory);
      setPhase('swipe');
    }
  }, [mapCategory, setCategories, setActiveCategory]);

  const showCards = phase === 'cards' && !activeCategory;
  const showMap = phase === 'map' && mapCategory && !activeCategory;
  const showSwipe = phase === 'swipe' || !!activeCategory;

  if (isAuthLoading || isPrefsLoading) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
         <div className="relative">
            <div className="w-24 h-24 rounded-[2.5rem] border-[6px] border-[#EB4898]/10 border-t-[#EB4898] animate-spin shadow-2xl" />
            <Cpu className="absolute inset-0 m-auto w-8 h-8 text-[#EB4898]/40 animate-pulse" />
         </div>
         <p className="text-[11px] font-black uppercase italic tracking-[0.4em] text-[#EB4898] mt-10 animate-pulse">Syncing Owner Logic...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center p-8 text-center transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
        <div className="max-w-sm space-y-10">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl">
            <Activity className="w-10 h-10 text-red-500 animate-bounce" />
          </div>
          <div className="space-y-4">
            <h2 className={cn("text-3xl font-black italic tracking-tighter uppercase leading-none", isLight ? "text-black" : "text-white")}>Connection Lost</h2>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-40 leading-relaxed">The owner matching engine is temporarily unreachable. Attempting network re-sync.</p>
          </div>
          <Button 
            onClick={() => { triggerHaptic('medium'); window.location.reload(); }}
            className="w-full h-18 rounded-[2rem] bg-[#EB4898] text-white font-black uppercase italic tracking-widest shadow-2xl active:scale-95"
          >
            Reconnect Terminal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full w-full relative transition-colors duration-500",
      isLight ? "bg-white" : "bg-black"
    )}>
      
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="absolute inset-x-0 top-0 h-96 pointer-events-none opacity-20">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[100%] bg-indigo-500/30 blur-[130px] rounded-full" />
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[80%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'insights' ? (
          <motion.div
            key="owner-insights"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 overflow-y-auto z-10"
          >
            <OwnerInsightsDashboard />
          </motion.div>
        ) : showCards ? (
          <motion.div 
            key="owner-dash-fan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden z-10"
            style={{ willChange: 'transform, opacity' }}
          >
            <OwnerAllDashboard onCardSelect={handleCardSelect} />
          </motion.div>
        ) : showMap && mapCategory ? (
          <motion.div
            key="owner-dash-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn("flex-1 w-full h-full flex flex-col items-stretch overflow-hidden", isLight ? 'bg-white' : 'bg-black')}
          >
            <DashboardMapCard className="flex-1 h-full w-full">
              <MapFilterChipRow mode="owner" onBack={handleMapBack} />
              <div className="flex-1 relative w-full h-full min-h-0">
                <DiscoveryMapView
                  category={mapCategory}
                  onBack={handleMapBack}
                  onStartSwiping={handleStartSwiping}
                  isEmbedded={true}
                  mode="owner"
                />
              </div>
            </DashboardMapCard>
          </motion.div>
        ) : showSwipe && !isLoading && clientProfiles.length === 0 ? (
          <motion.div
            key="owner-dash-map-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full z-10 flex flex-col"
          >
            <DashboardMapCard className="flex-1 h-full w-full relative">
              <MapFilterChipRow mode="owner" onBack={handleMapBack} />
              <div className="flex-1 relative w-full h-full min-h-0">
                <DiscoveryMapView
                  category={mapCategory || (filterCategory as any) || 'property'}
                  onBack={handleMapBack}
                  onStartSwiping={handleStartSwiping}
                  isEmbedded={true}
                  mode="owner"
                />
              </div>
            </DashboardMapCard>
          </motion.div>
        ) : showSwipe ? (
          <motion.div
            key="owner-dash-swipe"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 relative z-10"
            style={{ willChange: 'transform, opacity' }}
          >
            <ClientSwipeContainer
              onClientTap={handleClientTap}
              onInsights={handleInsights}
              onMessageClick={onMessageClick}
              onExhaustedMap={handleExhaustedMap}
              profiles={clientProfiles}
              isLoading={isLoading}
              error={error}
              insightsOpen={false}
              category={filterCategory || 'default'}
              filters={mergedFilters}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* SENTINEL RADAR: FLOATING TRIGGER REMOVED PER USER REQUEST */}

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
         <SheetContent side="bottom" className="h-[92vh] p-0 border-none bg-transparent overflow-hidden">
            <div className="w-full h-full glass-morphism rounded-t-[3.5rem] border-t border-white/10 overflow-y-auto">
               <div className="sticky top-0 z-[60] flex items-center justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
               </div>
               <div className="px-6 pb-20 pt-4">
                  <h2 className="text-xl font-black uppercase tracking-widest italic mb-6">Advanced Target Radar</h2>
                  <DiscoveryFilters
                    category={mapCategory || 'property'}
                    initialFilters={mergedFilters}
                    onApply={(_newFilters) => {
                      setShowFilters(false);
                    }}
                    activeCount={0}
                  />
               </div>
            </div>
         </SheetContent>
      </Sheet>
    </div>
  );
};

export default memo(EnhancedOwnerDashboard);
