import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { cn } from '@/lib/utils';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { RefreshCw, RotateCcw, Zap, SlidersHorizontal, ChevronLeft, Home, Bike, Briefcase } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Button } from '@/components/ui/button';
import { useCardReset } from '@/hooks/useCardReset';

interface SwipeExhaustedStateProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  error?: any;
  isInitialLoad?: boolean;
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
  isRefreshing,
  onRefresh,
  error,
  isInitialLoad = false,
}: SwipeExhaustedStateProps) => {
  const { theme, isLight } = useAppTheme();
  const { setCategories } = useFilterActions();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const setActiveCategory = useFilterStore(s => s.setActiveCategory);
  const resetMutation = useCardReset();
  const [scanIteration, setScanIteration] = useState(0);
  const [isScanBurstActive, setIsScanBurstActive] = useState(false);

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
        key="exhausted" 
        variants={deckFadeVariants} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        className="relative z-50 h-full w-full overflow-hidden flex flex-col items-center justify-center bg-transparent px-6"
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-20"
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
             className={cn(
               "flex items-center gap-2 px-4 h-11 rounded-2xl shadow-2xl backdrop-blur-3xl border transition-all active:scale-95 group", 
               isLight ? "bg-white border-black/10 text-black" : "bg-black/60 border-white/10 text-white"
             )}
           >
             <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-1" />
             <span className="text-[10px] font-black uppercase tracking-[0.15em]">Back</span>
           </button>
        </div>

        <div className="relative flex flex-col items-center text-center max-w-sm z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="mb-10 relative"
          >
            <div 
              className={cn(
                "w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden group border transition-all duration-500", 
                isLight ? "bg-white border-black/5 shadow-inner" : "bg-white/5 border-white/10"
              )}
              style={{ boxShadow: `0 20px 50px -10px ${activeCatInfo?.color || '#ec4899'}40` }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {activeCatInfo ? (
                <activeCatInfo.icon className={cn("w-12 h-12", isLight ? "text-slate-900" : "text-white")} strokeWidth={1.5} />
              ) : (
                <Zap className={cn("w-12 h-12", isLight ? "text-slate-900" : "text-white")} strokeWidth={1.5} />
              )}
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className={cn("absolute -inset-4 border rounded-[3rem] -z-1", isLight ? "border-black/10" : "border-white/10")} 
            />
          </motion.div>

          <h3 className={cn("text-3xl font-black italic tracking-tighter uppercase mb-4 leading-none", isLight ? "text-black" : "text-white")}>
            Discovery Complete
          </h3>
          <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-10 leading-relaxed px-4", isLight ? "text-black/40" : "text-white/40")}>
            You've analyzed all signals in this sector. Recalibrate your range or switch protocols to find new matches.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="h-16 w-full rounded-[1.8rem] bg-primary text-black font-black uppercase italic tracking-widest shadow-[0_15px_35px_rgba(var(--color-brand-primary-rgb),0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Tuning Intelligence...' : 'Relaunch Scan'}
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={resetMutation.isPending}
                onClick={() => {
                  triggerHaptic('heavy');
                  resetMutation.mutate(activeCategory as any || 'all');
                }}
                className={cn("flex-1 h-16 rounded-[1.8rem] border font-black uppercase italic tracking-widest transition-all active:scale-95", isLight ? "bg-black/5 hover:bg-black/10 border-black/10 text-black" : "bg-white/5 hover:bg-white/10 border-white/10 text-white")}
              >
                <RotateCcw className={cn("mr-2 w-5 h-5 text-orange-400", resetMutation.isPending && "animate-spin")} />
                Reset
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  triggerHaptic('medium');
                  (window as any).dispatchEvent(new CustomEvent('open-filters'));
                }}
                className={cn("w-16 h-16 rounded-[1.8rem] border flex items-center justify-center p-0 shadow-2xl transition-all active:scale-95", isLight ? "bg-black/5 hover:bg-black/10 border-black/10" : "bg-white/5 hover:bg-white/10 border-white/10")}
              >
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-20 pointer-events-none">
          <p className={cn("text-[8px] font-black uppercase tracking-[0.6em] italic", isLight ? "text-black/60" : "text-white")}>Sector Scan Logic Verified</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
