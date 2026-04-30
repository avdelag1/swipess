import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientSwipeContainer } from '@/components/ClientSwipeContainer';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { cn } from '@/lib/utils';
import { OwnerInsightsDashboard } from '@/components/OwnerInsightsDashboard';
import { OwnerAllDashboard } from '@/components/swipe/OwnerAllDashboard';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft, ChevronRight, Users, Building2, Zap } from 'lucide-react';
import { DistanceSlider } from '@/components/swipe/DistanceSlider';
import type { QuickFilterCategory } from '@/types/filters';
import { OWNER_INTENT_CARDS } from '@/components/swipe/CardData';
import useAppTheme from '@/hooks/useAppTheme';
import type { ClientFilters } from '@/hooks/smartMatching/types';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { useNavigate } from 'react-router-dom';
import { SwipeInsightsModal } from '@/components/SwipeInsightsModal';

const OWNER_SWIPE_MODE_KEY = 'swipess_owner_swipe_mode';

interface EnhancedOwnerDashboardProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
  filters?: any;
}

// 🛡️ Safety fallback to prevent crashes if imports fail
const SAFE_INTENT_CARDS = OWNER_INTENT_CARDS || [];

const EnhancedOwnerDashboard = ({ onClientInsights, onMessageClick, filters }: EnhancedOwnerDashboardProps) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const [viewMode] = useState<'discovery' | 'insights'>('discovery');
  const navigate = useNavigate();

  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setCategories, setClientType, setListingType, setActiveCategory } = useFilterActions();

  // 🛰️ DISCOVERY FLOW STATE
  const ownerPhase = useFilterStore(s => s.ownerPhase);
  const setOwnerPhase = useFilterStore(s => s.setOwnerPhase);

  // Sync phase with category clearing (e.g. from back buttons)
  useEffect(() => {
    if (!activeCategory && ownerPhase !== 'cards') {
      setOwnerPhase('cards');
    }
  }, [activeCategory, ownerPhase, setOwnerPhase]);

  // 🛰️ LOCATION & RADIUS HUD STATE
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const setRadiusKm = useFilterStore((s) => s.setRadiusKm);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const detectLocation = useCallback(async () => {
    setLocationDetecting(true);
    triggerHaptic('light');
    try {
      if (!navigator.geolocation) { setLocationDetecting(false); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation(pos.coords.latitude, pos.coords.longitude);
          setLocationDetected(true);
          setLocationDetecting(false);
          triggerHaptic('medium');
        },
        () => { setLocationDetecting(false); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } catch {
      setLocationDetecting(false);
    }
  }, [setUserLocation]);

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
    if (storeGender === 'any' && genders?.length) setClientGender(genders[0] as any);
    if (ownerPrefs.min_age != null || ownerPrefs.max_age != null) setClientAgeRange([ownerPrefs.min_age ?? 18, ownerPrefs.max_age ?? 65]);
    if (ownerPrefs.min_budget != null || ownerPrefs.max_budget != null) setClientBudgetRange([ownerPrefs.min_budget ?? 0, ownerPrefs.max_budget ?? 50000]);
    if (nationalities?.length) setClientNationalities(nationalities);
  }, [ownerPrefs, storeGender, setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities]);

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

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleClientTap = useCallback((clientId: string) => {
    if (onClientInsights) {
      onClientInsights(clientId);
    } else {
      setSelectedProfileId(clientId);
    }
  }, [onClientInsights]);

  const handleInsights = useCallback((clientId: string) => {
    if (onClientInsights) {
      onClientInsights(clientId);
    } else {
      setSelectedProfileId(clientId);
    }
  }, [onClientInsights]);

  const handleCardSelect = useCallback((card: any) => {
    triggerHaptic('medium');
    const cat = (card.id || card.category || 'buyers') as QuickFilterCategory;
    setCategories([cat]);
    setActiveCategory(cat);
    // 🚀 Bypass kilometer screen and jump straight to swipe cards!
    setOwnerPhase('swipe');
    if (card.clientType) setClientType(card.clientType as any);
    if (card.listingType) setListingType(card.listingType as any);
  }, [setClientType, setListingType, setActiveCategory, setCategories, setOwnerPhase]);

  // Clients ⇆ Listings toggle — persisted in localStorage
  const [ownerSwipeMode, setOwnerSwipeModeState] = useState<'clients' | 'listings'>(() => {
    try { return (localStorage.getItem(OWNER_SWIPE_MODE_KEY) as 'clients' | 'listings') || 'clients'; } catch { return 'clients'; }
  });
  const setOwnerSwipeMode = useCallback((mode: 'clients' | 'listings') => {
    triggerHaptic('light');
    setOwnerSwipeModeState(mode);
    try { localStorage.setItem(OWNER_SWIPE_MODE_KEY, mode); } catch {}
  }, []);

  // Quick-access: jump straight to swipe deck with 'all-clients' default
  const quickAccessSwipeDeck = useCallback(() => {
    triggerHaptic('medium');
    setCategories(['all-clients']);
    setActiveCategory('all-clients');
    setOwnerPhase('swipe');
  }, [setCategories, setActiveCategory, setOwnerPhase]);

  // Skip radius → jump straight to swipe deck
  const jumpToSwipeDeck = useCallback(() => {
    triggerHaptic('medium');
    setOwnerPhase('swipe');
  }, [setOwnerPhase]);

  const initialLoading = isAuthLoading || isPrefsLoading;
  const showSkeletons = activeCategory === null && initialLoading;

  return (
    <div className={cn("flex flex-col flex-1 min-h-0 w-full relative transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
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
        ) : ownerPhase === 'cards' ? (
          <motion.div
            key="owner-dash-fan"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-1 flex flex-col items-center w-full overflow-hidden z-10"
            style={{
              paddingTop: 'calc(var(--top-bar-height) + var(--safe-top))',
              paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 20px)',
              willChange: 'transform, opacity'
            }}
          >
            {/* Quick-access chip — skip card selection, jump straight to swipe */}
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              onClick={quickAccessSwipeDeck}
              className={cn(
                "absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95",
                isLight
                  ? "bg-white/80 border-black/10 text-black/70 shadow-sm hover:bg-white"
                  : "bg-white/[0.08] border-white/[0.12] text-white/70 hover:bg-white/[0.14]"
              )}
              style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              <Zap className="w-3 h-3" />
              Show Deck
            </motion.button>
            <div className="flex-1 w-full relative z-10 flex flex-col justify-center">
              <OwnerAllDashboard onCardSelect={handleCardSelect} />
            </div>
          </motion.div>
        ) : ownerPhase === 'kilometer' ? (
          <motion.div
            key="owner-dash-kilometer"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 relative z-20 flex flex-col w-full"
            style={{
              paddingTop: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 0px))',
              paddingBottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px))'
            }}
          >
            <OwnerKilometerView
              category={activeCategory || 'buyers'}
              onBack={() => { triggerHaptic('light'); setOwnerPhase('cards'); setActiveCategory(null); }}
              onNext={() => { triggerHaptic('medium'); setOwnerPhase('swipe'); }}
              onSkip={jumpToSwipeDeck}
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm}
              onDetectLocation={detectLocation}
              detecting={locationDetecting}
              detected={locationDetected}
              activeCard={SAFE_INTENT_CARDS.find(c => c.id === activeCategory)}
            />
          </motion.div>
        ) : (
          /* SWIPE PHASE — Clients or Listings, toggled by owner */
          <motion.div
            key="owner-dash-swipe"
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 relative z-10 flex flex-col w-full"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Clients ⇆ Listings toggle chip */}
            <div
              className="absolute top-4 right-4 z-30 flex items-center gap-1 p-1 rounded-2xl border"
              style={{
                background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(15,20,40,0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)',
                boxShadow: isLight ? '0 6px 20px rgba(0,0,0,0.08)' : '0 8px 28px rgba(0,0,0,0.35)',
              }}
            >
              <button
                onClick={() => setOwnerSwipeMode('clients')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                  ownerSwipeMode === 'clients'
                    ? "bg-[#f43f5e] text-white shadow-sm"
                    : (isLight ? "text-black/50 hover:text-black/80" : "text-white/50 hover:text-white/80")
                )}
              >
                <Users className="w-3 h-3" />
                Clients
              </button>
              <button
                onClick={() => setOwnerSwipeMode('listings')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                  ownerSwipeMode === 'listings'
                    ? "bg-[#f97316] text-white shadow-sm"
                    : (isLight ? "text-black/50 hover:text-black/80" : "text-white/50 hover:text-white/80")
                )}
              >
                <Building2 className="w-3 h-3" />
                Listings
              </button>
            </div>

            <AnimatePresence mode="wait">
              {ownerSwipeMode === 'clients' ? (
                <motion.div
                  key="swipe-clients"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 min-h-0 h-full"
                >
                  <ClientSwipeContainer
                    category={activeCategory as any}
                    profiles={clientProfiles}
                    isLoading={isLoading}
                    onBack={() => { triggerHaptic('light'); setOwnerPhase('kilometer'); }}
                    onClientInsights={handleClientTap}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="swipe-listings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 min-h-0 h-full"
                >
                  <SwipessSwipeContainer
                    onListingTap={() => {}}
                    filters={mergedFilters as any}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {typeof document !== 'undefined' && document.body && (
              <SwipeInsightsModal
                open={!!selectedProfileId}
                onOpenChange={(open) => !open && setSelectedProfileId(null)}
                profile={clientProfiles.find(p => p.user_id === selectedProfileId)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute bottom-4 left-6 text-[8px] font-black uppercase tracking-[0.6em] opacity-10 pointer-events-none z-0">Swipess FLAGSHIP v1.0.97</p>
    </div>
  );
};

// Internal sub-component for the stable Kilometer Page
const OwnerKilometerView = ({
  category,
  onBack,
  onNext,
  onSkip,
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  activeCard
}: any) => {
  const { isLight } = useAppTheme();

  const labels: any = {
    buyers: 'Buyers',
    renters: 'Renters',
    hire: 'Workers',
    'all-clients': 'Everyone',
  };

  const title = activeCard?.label || labels[category] || 'Discovery';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border",
              isLight ? "bg-white border-black/10 text-black shadow-sm" : "bg-white/10 border-white/10 text-white"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className={cn("text-3xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>{title}</h2>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mt-1", isLight ? "text-black/40" : "text-white/40")}>Kilometer Detector</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "w-full rounded-[3.5rem] border p-10 relative shadow-[0_40px_100px_rgba(0,0,0,0.15)]",
            isLight ? "bg-white/80 border-black/5 backdrop-blur-md" : "bg-black/60 border-white/10 backdrop-blur-xl"
          )}
        >
          <div className="mb-8">
            <h4 className={cn("text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-3", isLight ? "text-black" : "text-white")}>Sector Depth</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black italic tracking-tighter text-primary">{radiusKm}</span>
              <span className={cn("text-xl font-black italic opacity-40 uppercase", isLight ? "text-black" : "text-white")}>Kilometers</span>
            </div>
            <p className={cn("text-[11px] font-bold uppercase tracking-widest mt-2", isLight ? "text-black/50" : "text-white/50")}>
              Scanning {title.toLowerCase()} in your vicinity
            </p>
          </div>
          <div className="py-6">
            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="w-full h-20 rounded-[2.5rem] bg-primary font-black uppercase italic tracking-[0.2em] text-xl shadow-[0_20px_50px_rgba(236,72,153,0.3)] flex items-center justify-center gap-3 text-primary-foreground"
        >
          <span className="text-primary-foreground">Initiate Scan</span>
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </motion.button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className={cn(
              "w-full h-12 rounded-2xl font-black uppercase italic tracking-[0.25em] text-[11px] border transition-all active:scale-[0.98]",
              isLight
                ? "bg-white/60 border-black/10 text-black/70 hover:bg-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            )}
          >
            Skip → Show Clients
          </button>
        )}

        <p className={cn("text-center text-[10px] font-bold uppercase tracking-widest opacity-40", isLight ? "text-black" : "text-white")}>
          Adjust the radius to search for {title.toLowerCase()} nearby
        </p>
      </div>
    </div>
  );
};

export default memo(EnhancedOwnerDashboard);
