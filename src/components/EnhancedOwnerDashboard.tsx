import { useState, useEffect, useRef, memo, useMemo, lazy, useCallback, Suspense } from 'react';
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
import { Cpu, Activity, User, Megaphone, RefreshCw } from 'lucide-react';
import { useModalStore } from '@/state/modalStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { OwnerInsightsDashboard } from '@/components/OwnerInsightsDashboard';
import { OwnerAllDashboard } from '@/components/swipe/OwnerAllDashboard';
const DiscoveryMapView = lazy(() => import('@/components/swipe/DiscoveryMapView'));
import { useFilterActions } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';
import type { QuickFilterCategory } from '@/types/filters';
import { useTheme } from '@/hooks/useTheme';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import { useTranslation } from 'react-i18next';
import type { ClientFilters } from '@/hooks/smartMatching/types';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; 
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [viewMode] = useState<'discovery' | 'insights'>('discovery');
  
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setCategories, setClientType, setListingType, setActiveCategory } = useFilterActions();
  const { setModal } = useModalStore();

  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>(activeCategory ? 'map' : 'cards');
  const [showFilters, setShowFilters] = useState(false);

  const { user, loading: isAuthLoading } = useAuth();
  const { navigate } = useAppNavigate();

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
    if (!activeCategory && (phase === 'swipe' || phase === 'map')) {
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

  const handleCardSelect = useCallback((card: any) => {
    triggerHaptic('medium');
    const cat = (card.category || 'property') as QuickFilterCategory;
    
    setCategories([cat]);
    setActiveCategory(cat);
    setPhase('map'); 
    
    if (card.clientType) setClientType(card.clientType as any);
    if (card.listingType) setListingType(card.listingType as any);
  }, [setClientType, setListingType, setActiveCategory, setCategories]);

  const handleDiscoveryBack = useCallback(() => {
    setPhase('cards');
    setActiveCategory(null);
  }, [setActiveCategory]);

  const handleStartSwiping = useCallback(() => {
    setPhase('swipe');
  }, []);

  if (isAuthLoading || isPrefsLoading) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
         <div className="relative">
            <div className="w-24 h-24 rounded-[2.5rem] border-[6px] border-primary/10 border-t-primary animate-spin shadow-2xl" />
            <Cpu className="absolute inset-0 m-auto w-8 h-8 text-primary/40 animate-pulse" />
         </div>
         <p className="text-[11px] font-black uppercase italic tracking-[0.4em] text-primary mt-10 animate-pulse">Syncing Owner Logic...</p>
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
            <p className="text-[11px] font-black uppercase tracking-widest opacity-40 leading-relaxed">The owner matching engine is temporarily unreachable. Attempting matrix re-sync.</p>
          </div>
          <Button 
            onClick={() => { triggerHaptic('medium'); window.location.reload(); }}
            className="w-full h-18 rounded-[2rem] bg-primary text-black font-black uppercase italic tracking-widest shadow-2xl active:scale-95"
          >
            Reconnect Terminal
          </Button>
        </div>
      </div>
    );
  }

  const showCards = !activeCategory && phase === 'cards';
  const showMap = !!activeCategory && phase === 'map';
  const showSwipe = !!activeCategory && (phase === 'swipe' || phase === 'cards'); 

  return (
    <div className={cn("flex flex-col h-full w-full relative transition-colors duration-500 overflow-hidden", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-brand-primary-rgb),0.02)_0%,transparent_70%)]" />
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
            className="relative flex flex-col items-center w-full h-full overflow-hidden z-10"
            style={{ 
              paddingTop: 'calc(var(--top-bar-height) + var(--safe-top) + 20px)',
              paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom))',
              willChange: 'transform, opacity' 
            }}
          >
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <OwnerAllDashboard onCardSelect={handleCardSelect} />
            </div>
          </motion.div>
        ) : showMap && activeCategory ? (
          <motion.div
            key={`owner-map-${activeCategory}`}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[1000] flex flex-col overflow-hidden bg-black/40 backdrop-blur-xl rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-[10002]" />

            <Suspense fallback={<div className="flex-1 bg-black/10 animate-pulse" />}>
              <DiscoveryMapView 
                category={activeCategory} 
                onBack={handleDiscoveryBack}
                onStartSwiping={handleStartSwiping}
                mode="owner"
              />
            </Suspense>
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
              profiles={clientProfiles}
              isLoading={isLoading}
              error={error}
              insightsOpen={false}
              category={activeCategory || 'default'}
              filters={mergedFilters}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
         <SheetContent side="bottom" className="h-[92vh] p-0 border-none bg-transparent overflow-hidden">
            <div className="w-full h-full glass-morphism rounded-t-[3.5rem] border-t border-white/10 overflow-y-auto">
               <div className="sticky top-0 z-[60] flex items-center justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
               </div>
               <div className="px-6 pb-20 pt-4">
                  <h2 className="text-xl font-black uppercase tracking-widest italic mb-6">{t('topbar.targetPlatform')}</h2>
                   <DiscoveryFilters
                    category={activeCategory || 'property'}
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
      
      <p className="absolute bottom-4 left-6 text-[8px] font-black uppercase tracking-[0.6em] opacity-10 pointer-events-none z-0">Swipess Admin Dashboard Protocol</p>
    </div>
  );
};

export default memo(EnhancedOwnerDashboard);
