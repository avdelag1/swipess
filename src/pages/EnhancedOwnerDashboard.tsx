import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OwnerInsightsDashboard } from '@/components/OwnerInsightsDashboard';
import { OwnerAllDashboard } from '@/components/swipe/OwnerAllDashboard';
import { triggerHaptic } from '@/utils/haptics';
import type { QuickFilterCategory } from '@/types/filters';
import useAppTheme from '@/hooks/useAppTheme';
import { useTranslation } from 'react-i18next';
import type { ClientFilters } from '@/hooks/smartMatching/types';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; 
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const [viewMode] = useState<'discovery' | 'insights'>('discovery');
  
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setCategories, setClientType, setListingType, setActiveCategory } = useFilterActions();

  // 🛸 OWNER DASHBOARD ALWAYS STARTS ON CARDS — clear any stale persisted category on mount
  // This prevents the dashboard from jumping to swipe phase with no data
  const [phase, setPhase] = useState<'cards' | 'swipe'>('cards');

  // Clear stale activeCategory on mount so owner always sees card deck first
  useEffect(() => {
    if (activeCategory) {
      setActiveCategory(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // 🛰️ PHASE SYNC: Bi-directional sync (after mount)
  useEffect(() => {
    if (activeCategory && phase === 'cards') {
      setPhase('swipe');
    } else if (!activeCategory && phase === 'swipe') {
      setPhase('cards');
    }
  }, [activeCategory, phase]);

  const { user, loading: isAuthLoading } = useAuth();

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
    
    if (card.clientType) setClientType(card.clientType as any);
    if (card.listingType) setListingType(card.listingType as any);
  }, [setClientType, setListingType, setActiveCategory, setCategories]);

  if (isAuthLoading || isPrefsLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-transparent">
         <div className="relative">
            <div className="w-24 h-24 rounded-[2.5rem] border-[6px] border-primary/10 border-t-primary animate-spin shadow-2xl" />
            <div className="absolute inset-0 m-auto w-8 h-8 bg-primary/40 rounded-full animate-pulse" />
         </div>
         <p className="text-[11px] font-black uppercase italic tracking-[0.4em] text-primary mt-10 animate-pulse">Syncing Owner Logic...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center bg-transparent">
        <div className="max-w-sm space-y-10">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl">
            <div className="w-10 h-10 bg-red-500 rounded-full animate-bounce" />
          </div>
          <div className="space-y-4">
            <h2 className={cn("text-3xl font-black italic tracking-tighter uppercase leading-none", isLight ? "text-black" : "text-white")}>Connection Lost</h2>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-40 leading-relaxed">The owner matching engine is temporarily unreachable. Attempting re-sync.</p>
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

  return (
    <div className={cn("flex flex-col h-full w-full relative transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      <AtmosphericLayer variant="primary" />

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
        ) : phase === 'cards' ? (
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
            <div className="flex-1 w-full relative z-10 flex flex-col">
              <OwnerAllDashboard onCardSelect={handleCardSelect} />
            </div>
          </motion.div>
        ) : (
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
        )}
      </AnimatePresence>

      <p className="absolute bottom-4 left-6 text-[8px] font-black uppercase tracking-[0.6em] opacity-10 pointer-events-none z-0">Swipess FLAGSHIP v1.0.96-rc4</p>
    </div>
  );
};

export default memo(EnhancedOwnerDashboard);
