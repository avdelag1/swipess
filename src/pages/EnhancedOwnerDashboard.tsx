import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { LocationRadiusSelector } from '@/components/swipe/LocationRadiusSelector';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { cn } from '@/lib/utils';
import { OwnerInsightsDashboard } from '@/components/OwnerInsightsDashboard';
import { OwnerAllDashboard } from '@/components/swipe/OwnerAllDashboard';
import { triggerHaptic } from '@/utils/haptics';
import type { QuickFilterCategory } from '@/types/filters';
import useAppTheme from '@/hooks/useAppTheme';
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

  // Derive phase directly from activeCategory — no intermediate state, no race conditions
  const phase = activeCategory ? 'swipe' : 'cards';

  const { user, loading: isAuthLoading } = useAuth();

  // Persistent radius HUD state — survives deck reloads and demo fallbacks
  const { radiusKm, setRadiusKm, lat, lng } = useFilterStore(useShallow(s => ({
    radiusKm: s.radiusKm,
    setRadiusKm: s.setRadiusKm,
    lat: s.userLatitude,
    lng: s.userLongitude,
  })));
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(!!lat && !!lng);
  const [hudExpanded, setHudExpanded] = useState(false);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        useFilterStore.getState().setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setDetecting(false);
        setDetected(true);
        triggerHaptic('success');
      },
      () => {
        setDetecting(false);
        triggerHaptic('warning');
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

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

  // Auto-expand radius selector when entering swipe phase
  useEffect(() => {
    if (phase === 'swipe') {
      setHudExpanded(true);
    } else {
      setHudExpanded(false);
    }
  }, [phase]);

  const storeFilterVersion = useFilterStore((s) => s.filterVersion);
  const clientFilters = useMemo(() => {
    return useFilterStore.getState().getClientFilters();
  }, [storeFilterVersion]);

  const mergedFilters = useMemo(() => {
    return { ...filters, ...clientFilters };
  }, [filters, clientFilters]);

  const { data: clientProfiles = [], isLoading, error } = useSmartClientMatching(
    user?.id,
    activeCategory as any,
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
    const cat = (card.id || card.category || 'buyers') as QuickFilterCategory;
    setCategories([cat]);
    setActiveCategory(cat);
    if (card.clientType) setClientType(card.clientType as any);
    if (card.listingType) setListingType(card.listingType as any);
  }, [setClientType, setListingType, setActiveCategory, setCategories]);

  const initialLoading = isAuthLoading || isPrefsLoading;
  const showSkeletons = activeCategory === null && initialLoading;

  return (
    <div className={cn("flex flex-col h-full w-full relative transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      <AtmosphericLayer variant="primary" />

      <AnimatePresence mode="wait">
        {showSkeletons ? (
          <motion.div
            key="loading-skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 z-10"
          >
             <div className="relative">
                <div className="w-20 h-20 rounded-[2.2rem] border-[4px] border-primary/10 border-t-primary animate-spin shadow-2xl" />
                <div className="absolute inset-0 m-auto w-6 h-6 bg-primary/40 rounded-full animate-pulse" />
             </div>
             <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-primary/60 animate-pulse">Synchronizing Swipess Logic...</p>
             <div className="w-full max-w-sm space-y-3 pt-8">
                <div className="h-24 w-full bg-white/5 rounded-3xl animate-pulse" />
                <div className="h-24 w-full bg-white/5 rounded-3xl animate-pulse opacity-50" />
             </div>
          </motion.div>
        ) : viewMode === 'insights' ? (
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
            className="relative flex-1 flex flex-col items-center w-full overflow-hidden z-10"
            style={{
              paddingTop: 'calc(var(--top-bar-height) + var(--safe-top))',
              paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 20px)',
              willChange: 'transform, opacity'
            }}
          >
            <div className="flex-1 w-full relative z-10 flex flex-col justify-center">
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
            className="flex-1 min-h-0 relative z-10 flex flex-col w-full h-full"
            style={{
              willChange: 'transform, opacity',
              paddingTop: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 0px))',
              paddingBottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px))'
            }}
          >
            <div className="flex-1 min-h-0 h-full">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 PERSISTENT RADIUS HUD — always visible in swipe phase, collapses to pill */}
      <AnimatePresence>
        {phase === 'swipe' && (
          <motion.div
            key="radius-hud"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="fixed z-[10010] pointer-events-none"
            style={{
              top: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 0px) + 10px)',
              right: '16px',
            }}
          >
            <LocationRadiusSelector
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm as any}
              onDetectLocation={handleDetectLocation}
              detecting={detecting}
              detected={detected}
              title="clients"
              expanded={hudExpanded}
              onExpandedChange={setHudExpanded}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute bottom-4 left-6 text-[8px] font-black uppercase tracking-[0.6em] opacity-10 pointer-events-none z-0">Swipess FLAGSHIP v1.0.96-rc4</p>
    </div>
  );
};

export default memo(EnhancedOwnerDashboard);
