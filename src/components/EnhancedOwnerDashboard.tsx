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
import { User, Megaphone } from 'lucide-react';
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
import type { QuickFilterCategory } from '@/types/filters';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any; 
}

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const [_selectedClientId, _setSelectedClientId] = useState<string | null>(null);
  const [_insightsOpen, _setInsightsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'discovery' | 'insights'>('discovery');
  
  // Track 3-phase dashboard flow
  const activeCategory = useFilterStore(s => s.activeCategory);
  const [phase, setPhase] = useState<'cards' | 'map' | 'swipe'>(activeCategory ? 'swipe' : 'cards');
  const [mapCategory, setMapCategory] = useState<QuickFilterCategory | null>(null);

  const modalStore = useModalStore();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilterVersion]);

  const mergedFilters = useMemo(() => {
    return { ...filters, ...clientFilters };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilterVersion, filters]);

  const filterCategory = mergedFilters?.categories?.[0] || undefined;
  const { data: clientProfiles = [], isLoading, error } = useSmartClientMatching(
    user?.id,
    filterCategory,
    0,
    50,
    false,
    mergedFilters as ClientFilters
  );

  if (import.meta.env.DEV && error) {
    console.error('[EnhancedOwnerDashboard] Profile fetch error:', error);
  }

  const handleClientTap = useCallback((clientId: string) => {
    onClientInsights?.(clientId);
  }, [onClientInsights]);

  const handleInsights = useCallback((clientId: string) => {
    onClientInsights?.(clientId);
  }, [onClientInsights]);

  // Conditionally hide category fan when in insights mode
  const effectiveCategory = viewMode === 'insights' ? 'insights-active' : activeCategory;

  const handleCardSelect = useCallback((card: OwnerIntentCard) => {
    triggerHaptic('medium');
    const cat = (card.category || 'property') as QuickFilterCategory;
    setMapCategory(cat);
    if (card.clientType) setClientType(card.clientType as any);
    if (card.listingType) setListingType(card.listingType as any);
    setPhase('map');
  }, [setClientType, setListingType]);

  const handleMapBack = useCallback(() => {
    setMapCategory(null);
    setPhase('cards');
    setActiveCategory(null);
  }, [setActiveCategory]);

  const handleStartSwiping = useCallback(() => {
    if (mapCategory) {
      setCategories([mapCategory]);
      setPhase('swipe');
    }
  }, [mapCategory, setCategories]);

  // Determine what to show based on phase + store state
  const showCards = phase === 'cards' && !activeCategory;
  const showMap = phase === 'map' && mapCategory && !activeCategory;
  const showSwipe = phase === 'swipe' || !!activeCategory;

  // Loading state handling
  if (isAuthLoading || isPrefsLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Owner Experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center bg-background/50 backdrop-blur-md">
        <div className="max-w-xs space-y-6">
          <div className="w-20 h-20 bg-destructive/20 rounded-3xl flex items-center justify-center mx-auto border border-destructive/30">
            <Megaphone className="w-10 h-10 text-destructive animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Sync Interrupted</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn't reach the matching engine. This usually fixes itself in a few seconds.
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline" 
            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Reconnect
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold">Access Required</h2>
          <p className="text-sm text-muted-foreground">Please log in to access the owner dashboard features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <AnimatePresence mode="popLayout">
        {viewMode === 'insights' ? (
          <motion.div
            key="owner-insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto pt-2"
          >
            <OwnerInsightsDashboard />
          </motion.div>
        ) : showCards ? (
          <motion.div 
            key="owner-dash-fan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            <OwnerAllDashboard onCardSelect={handleCardSelect} />
          </motion.div>
        ) : showMap && mapCategory ? (
          <motion.div
            key="owner-dash-map"
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
              mode="owner"
            />
          </motion.div>
        ) : showSwipe ? (
          <motion.div 
            key="owner-dash-swipe"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 relative"
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
              category={filterCategory || 'default'}
              filters={mergedFilters}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// Memoize to prevent re-renders from parent state changes
export default memo(EnhancedOwnerDashboard);
