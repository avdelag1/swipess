import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';
import { cn } from '@/lib/utils';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { RefreshCw, RotateCcw, Zap, SlidersHorizontal, ChevronLeft, Home, Bike, Briefcase, Search } from 'lucide-react';
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

  const handleRefreshClick = () => {
    triggerHaptic('medium');
    setScanIteration((current) => current + 1);
    onRefresh();
  };

  const activeCatInfo = activeCategory ? CATEGORY_ICONS[activeCategory] : CATEGORY_ICONS.all;

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
        {/* ATMOSPHERIC BACKGROUND RADAR */}
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 2, 3],
              opacity: [0.3, 0.1, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute w-[300px] h-[300px] rounded-full border border-primary/20"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.2, 0.05, 0]
            }}
            transition={{ 
              duration: 4, 
              delay: 1.3,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute w-[300px] h-[300px] rounded-full border border-primary/10"
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: activeCatInfo?.color || '#ec4899' }}
          />
        </div>

        {/* TOP BAR ACTION */}
        <div className="absolute top-4 left-4 z-[90]">
           <button
             onClick={() => {
               triggerHaptic('medium');
               setActiveCategory(null);
               setCategories([]);
             }}
             className={cn(
               "flex items-center gap-2 px-4 h-11 rounded-2xl shadow-2xl backdrop-blur-3xl border transition-all active:scale-95 group", 
               isLight ? "bg-white border-black/10 text-black" : "bg-black/80 border-white/20 text-white"
             )}
           >
             <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-1" />
             <span className="text-[10px] font-black uppercase tracking-[0.15em]">Sectors</span>
           </button>
        </div>

        <div className="relative flex flex-col items-center text-center max-w-sm z-10 w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="mb-10 relative"
          >
            {/* CENTRAL ICON CONTEXT */}
            <div 
              className={cn(
                "w-32 h-32 rounded-[2.8rem] flex items-center justify-center shadow-2xl relative overflow-hidden group border transition-all duration-700", 
                isLight ? "bg-white border-black/5" : "bg-black/40 border-white/20 backdrop-blur-3xl"
              )}
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-10 bg-[url('/noise.png')] bg-repeat"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-40" />
              
              {/* RADAR SWEEP LINE */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 z-0 origin-center"
              >
                <div className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-primary/40 blur-[1px]" />
              </motion.div>

              {activeCatInfo ? (
                <activeCatInfo.icon className={cn("w-14 h-14 relative z-10", isLight ? "text-slate-900" : "text-white")} strokeWidth={1.2} />
              ) : (
                <Search className={cn("w-14 h-14 relative z-10", isLight ? "text-slate-900" : "text-white")} strokeWidth={1.2} />
              )}
            </div>

            {/* PULSE RINGS */}
            {[1, 2].map((i) => (
              <motion.div 
                key={i}
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: 3, delay: i * 1.5, repeat: Infinity }}
                className={cn("absolute -inset-4 border rounded-[3.5rem] -z-1", isLight ? "border-black/10" : "border-white/10")} 
              />
            ))}
          </motion.div>

          <div className="space-y-2 mb-12">
            <h3 className={cn("text-4xl font-black italic tracking-tighter uppercase leading-none", isLight ? "text-black" : "text-white")}>
              Signals Faded
            </h3>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.25em] leading-relaxed px-8", isLight ? "text-black/50" : "text-white/50")}>
              Current coordinates analyzed. Recalibrate range or reset protocol to discover new opportunities.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full px-2">
            <Button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="h-20 w-full rounded-[2.2rem] bg-primary text-black font-black uppercase italic tracking-widest shadow-[0_20px_50px_rgba(var(--color-brand-primary-rgb),0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border-none text-base"
            >
              <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Recalibrating...' : 'Refresh Intel'}
            </Button>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                disabled={resetMutation.isPending}
                onClick={() => {
                  triggerHaptic('heavy');
                  resetMutation.mutate(activeCategory as any || 'all');
                }}
                className={cn("flex-1 h-18 rounded-[2rem] border font-black uppercase italic tracking-widest transition-all active:scale-95 text-xs", isLight ? "bg-black/5 hover:bg-black/10 border-black/10 text-black" : "bg-white/5 hover:bg-white/10 border-white/20 text-white backdrop-blur-md")}
              >
                <RotateCcw className={cn("mr-2 w-5 h-5 text-orange-400", resetMutation.isPending && "animate-spin")} />
                Reset Session
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  triggerHaptic('medium');
                  (window as any).dispatchEvent(new CustomEvent('open-filters'));
                }}
                className={cn("w-18 h-18 rounded-[2rem] border flex items-center justify-center p-0 shadow-2xl transition-all active:scale-95", isLight ? "bg-black/5 hover:bg-black/10 border-black/10" : "bg-white/5 hover:bg-white/10 border-white/20 backdrop-blur-md")}
              >
                <SlidersHorizontal className="h-6 w-6 text-primary" />
              </Button>
            </div>
          </div>
        </div>

        {/* BOTTOM DECOR */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 opacity-30 pointer-events-none">
          <div className="w-12 h-[2px] bg-primary/50 rounded-full" />
          <p className={cn("text-[7px] font-black uppercase tracking-[0.8em] italic", isLight ? "text-black/60" : "text-white")}>Sector Logic Verified</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
