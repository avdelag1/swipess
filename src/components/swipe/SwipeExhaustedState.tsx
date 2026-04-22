import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Zap, Home, Bike, Briefcase, SlidersHorizontal, ChevronLeft } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Button } from '@/components/ui/button';
import { RadarNode, LocationRadiusSelector } from './LocationRadiusSelector';
import { useSmartListingMatching } from '@/hooks/useSmartMatching';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { cn } from '@/lib/utils';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';
import { useCardReset } from '@/hooks/useCardReset';
import { useAuth } from '@/hooks/useAuth';

interface SwipeExhaustedStateProps {
  categoryLabel: string;
  CategoryIcon: React.ReactNode | React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  iconColor?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
  error?: any;
  isInitialLoad?: boolean;
  role?: 'client' | 'owner';
  lat?: number | null;
  lng?: number | null;
  onGoToMap?: () => void;
}

const CATEGORY_ICONS: Record<string, { icon: any; label: string; color: string }> = {
  all:        { icon: Zap,            label: 'All',         color: '#ec4899' },
  property:   { icon: Home,           label: 'Property',    color: '#3b82f6' },
  motorcycle: { icon: MotorcycleIcon, label: 'Motos',       color: '#f97316' },
  bicycle:    { icon: Bike,           label: 'Bikes',       color: '#f43f5e' },
  services:   { icon: Briefcase,      label: 'Work',        color: '#a855f7' },
  worker:     { icon: Briefcase,      label: 'Work',        color: '#a855f7' },
};

export const SwipeExhaustedState = ({
  categoryLabel: _categoryLabel,
  CategoryIcon: _CategoryIcon,
  isRefreshing,
  onRefresh,
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  error,
  isInitialLoad = false,
  lat,
  lng,
}: SwipeExhaustedStateProps) => {
  const { theme } = useTheme();
  const { setCategories } = useFilterActions();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const setActiveCategory = useFilterStore(s => s.setActiveCategory);
  const resetMutation = useCardReset();
  const [scanIteration, setScanIteration] = useState(0);
  const [isScanBurstActive, setIsScanBurstActive] = useState(false);

  // FETCH DATA FOR THE RADAR NODES
  const { user } = useAuth();
  const { data: smartListings } = useSmartListingMatching(
    user?.id,
    [],
    {
      categories: activeCategory ? [activeCategory as any] : undefined,
      radiusKm: radiusKm,
      userLatitude: lat || undefined,
      userLongitude: lng || undefined,
    },
    0,
    40
  );

  const radarNodes: RadarNode[] = useMemo(() => {
    return (smartListings || []).map(l => ({
      id: l.id,
      lat: l.latitude || 0,
      lng: l.longitude || 0,
      label: l.title || 'Discovery',
      price: l.price ? `$${l.price.toLocaleString()}` : undefined
    }));
  }, [smartListings]);

  useEffect(() => {
    if (scanIteration === 0) return;
    setIsScanBurstActive(true);
    const timeout = window.setTimeout(() => {
      setIsScanBurstActive(false);
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [scanIteration]);

  const handleCategorySwitch = (catId: string) => {
    triggerHaptic('medium');
    setCategories([catId as any]);
  };

  const handleRefreshClick = () => {
    triggerHaptic('medium');
    setScanIteration((current) => current + 1);
    onRefresh();
  };

  const activeCatInfo = activeCategory ? CATEGORY_ICONS[activeCategory] : null;

  if (error && isInitialLoad) {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="error" 
          variants={deckFadeVariants} 
          initial="initial" 
          animate="animate" 
          exit="exit" 
          className="relative w-full z-50 flex flex-col items-center justify-center px-4 bg-background"
          style={{ minHeight: 'calc(100dvh - 120px)' }}
        >
          <div className="text-center bg-destructive/5 border-destructive/20 p-10 rounded-[3rem] backdrop-blur-3xl border">
            <div className="text-7xl mb-6">📡</div>
            <h3 className="text-2xl font-black mb-3 text-destructive tracking-tighter uppercase">System Disconnected</h3>
            <p className="text-muted-foreground/80 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
              We've lost the uplink. Recalibrate and try again.
            </p>
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              className="gap-3 h-14 px-8 rounded-full border-destructive/30 hover:bg-destructive/10 transition-all font-black uppercase text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Repair Connection
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="searching" 
        variants={deckFadeVariants} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        className="relative z-50 h-full w-full overflow-hidden flex flex-col pt-2 bg-transparent"
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
            style={{ background: activeCatInfo?.color || '#ec4899' }}
          />
        </div>

        {/* BACK TO QUICK FILTERS */}
        <div className="absolute top-4 left-4 z-[90]">
           <button
             onClick={() => {
               triggerHaptic('medium');
               setActiveCategory(null);
               setCategories([]);
             }}
             className="flex items-center gap-2 px-4 h-11 rounded-2xl shadow-2xl backdrop-blur-3xl border transition-all active:scale-95 group bg-black/60 border-white/10 text-white"
           >
             <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-1" />
             <span className="text-[10px] font-black uppercase tracking-[0.15em]">Back</span>
           </button>
        </div>

        {/* 🚀 BOUNDLESS Swipess RADAR — Edge-to-edge immersive technical design */}
        <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center">
          <div className="absolute top-[12%] flex flex-col items-center gap-2 pointer-events-none z-[100]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-5 py-2 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 bg-black/80 backdrop-blur-3xl"
            >
              <div className="flex flex-col items-center gap-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.30em] text-primary animate-pulse">
                  {isRefreshing || isScanBurstActive ? 'Recalibrating Array' : 'Swipess Radar Initialized'}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/40">
                  {radarNodes.length > 0 ? `Tracking ${radarNodes.length} Nodes in Vicinity` : 'No signals detected. Increase range.'}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="w-full h-full relative overflow-hidden">
            <LocationRadiusSelector
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation || (() => {})}
              detecting={detecting ?? false}
              detected={detected ?? false}
              lat={lat}
              lng={lng}
              nodes={radarNodes}
            />
          </div>
        </div>

        <div className="shrink-0 pb-6 pt-3 px-4 flex flex-col items-center gap-4 bg-gradient-to-t from-black via-black/80 to-transparent">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex w-full justify-center"
          >
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 backdrop-blur-3xl shadow-2xl">
              {Object.entries(CATEGORY_ICONS).filter(([k]) => k !== 'worker').map(([catId, info]) => {
                const Icon = info.icon;
                const isActive = activeCategory === catId;
                return (
                  <button
                    key={catId}
                    onClick={() => handleCategorySwitch(catId)}
                    title={info.label}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 active:scale-90",
                      isActive
                        ? "bg-white/15 shadow-xl border border-white/10"
                        : "hover:bg-white/5"
                    )}
                    style={isActive ? { boxShadow: `0 0 30px ${info.color}30, inset 0 1px 0 rgba(255,255,255,0.1)` } : undefined}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                      strokeWidth={isActive ? 2 : 1.5}
                      style={{ color: isActive ? info.color : 'var(--muted-foreground)', opacity: isActive ? 1 : 0.6 }}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap overflow-hidden transition-all",
                        isActive ? "w-auto opacity-100" : "w-0 opacity-0 hidden sm:block sm:w-auto sm:opacity-50"
                      )}
                      style={{ color: isActive ? info.color : undefined }}
                    >
                      {info.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="flex items-center gap-3 w-full max-w-sm">
            <Button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex-1 relative h-14 overflow-hidden shadow-2xl transition-all active:scale-95 group rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/5"
            >
              {isRefreshing && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
              <RefreshCw className={cn("mr-2 h-4 w-4 transition-transform group-hover:rotate-180 duration-700", isRefreshing && "animate-spin", "text-primary")} />
              {isRefreshing ? 'Tuning Intelligence...' : 'Relaunch Scan'}
            </Button>
            
            <Button
              variant="outline"
              disabled={resetMutation.isPending}
              onClick={() => {
                triggerHaptic('heavy');
                resetMutation.mutate(activeCategory as any || 'all');
              }}
              className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center p-0 shadow-2xl transition-all active:scale-95 border border-white/5 group"
            >
              <RotateCcw className={cn("h-5 w-5 text-orange-400 transition-transform group-hover:-rotate-90", resetMutation.isPending && "animate-spin")} />
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                triggerHaptic('medium');
                (window as any).dispatchEvent(new CustomEvent('open-filters'));
              }}
              className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center p-0 shadow-2xl transition-all active:scale-95 border border-white/5"
            >
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
