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
  role?: 'client' | 'owner';
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
  role = 'client'
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
        {/* 🛸 ZENITH RADAR: High-Fidelity Discovery Animation */}
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 2.5],
              opacity: [0.15, 0]
            }}
            transition={{ 
              duration: 3.5, 
              repeat: Infinity,
              ease: "circOut"
            }}
            className="absolute w-[400px] h-[400px] rounded-full border border-primary/10 shadow-[0_0_50px_rgba(var(--color-brand-primary-rgb),0.05)]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 2],
              opacity: [0.1, 0]
            }}
            transition={{ 
              duration: 3.5, 
              delay: 1.7,
              repeat: Infinity,
              ease: "circOut"
            }}
            className="absolute w-[400px] h-[400px] rounded-full border border-primary/5"
          />
          {/* Scanning Beam */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-[800px] h-[2px] bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-30"
          />
          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-10"
            style={{ background: activeCatInfo?.color || '#ec4899' }}
          />
        </div>

        {/* TOP BAR ACTION - Significant padding to clear system UI and header buttons */}
        <div className="absolute top-32 left-8 z-[90]">
           <button
             onClick={() => {
               triggerHaptic('medium');
               setActiveCategory(null);
               setCategories([]);
             }}
             className={cn(
               "flex items-center gap-3 px-6 h-14 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl border transition-all active:scale-95 group", 
               isLight ? "bg-white/90 border-black/10 text-black" : "bg-black/40 border-white/20 text-white"
             )}
           >
             <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-1" />
             <span className="text-[12px] font-black uppercase tracking-[0.25em]">Back</span>
           </button>
        </div>

        <div className="relative flex flex-col items-center text-center max-w-sm z-10 w-full pt-[26dvh] pb-20">
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

          <div className="space-y-3 mb-14 px-4">
            <h3 className={cn("text-5xl font-black italic tracking-tighter uppercase leading-none", isLight ? "text-black" : "text-white")}>
              {role === 'owner' ? 'Horizon Clear' : 'Signals Faded'}
            </h3>
            <p className={cn("text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed", isLight ? "text-black/60" : "text-white/60")}>
              {role === 'owner' 
                ? 'You have analyzed all active clients in this sector. Recalibrate your radar parameters to find new matches.'
                : 'Current coordinates analyzed. Recalibrate range or reset protocol to discover new opportunities.'
              }
            </p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-4 w-full px-2"
          >
            {/* PRIMARY SECTOR SWITCHER: Text-based as requested */}
            <button
              onClick={() => {
                triggerHaptic('heavy');
                // Cycle main categories
                const categories: string[] = ['property', 'motorcycle', 'bicycle', 'services'];
                const currentIdx = categories.indexOf(activeCategory || 'property');
                const nextIdx = (currentIdx + 1) % categories.length;
                setActiveCategory(categories[nextIdx] as any);
                setCategories([categories[nextIdx]] as any);
              }}
              className={cn(
                "w-full h-20 rounded-[2.5rem] flex items-center justify-between px-8 transition-all active:scale-95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border backdrop-blur-3xl group relative overflow-hidden",
                isLight ? "bg-black text-white border-white/20" : "bg-white text-black border-black/10"
              )}
            >
              <div className="flex flex-col items-start z-10">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-50", isLight ? "text-white" : "text-black")}>Discovery Protocol</span>
                <span className="text-[16px] font-black uppercase tracking-wider">Change Sector</span>
              </div>
              <Search className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-all group-hover:scale-110 z-10" />
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="flex gap-4 w-full">
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className={cn(
                  "flex-1 h-20 rounded-[2rem] flex items-center justify-center gap-4 transition-all active:scale-95 border-2 shadow-[0_25px_60px_-15px_rgba(var(--color-brand-primary-rgb),0.3)]",
                  isLight ? "bg-black border-white/20 text-white" : "bg-white border-black/10 text-black"
                )}
              >
                <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} />
                <div className="flex flex-col items-start">
                  <span className="text-[14px] font-black uppercase tracking-wider leading-none mb-1">Relaunch Scan</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">Deep Sync Active</span>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  (window as any).dispatchEvent(new CustomEvent('open-filters'));
                }}
                className={cn(
                  "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all active:scale-95 border-2 shadow-2xl group",
                  isLight ? "bg-white border-black/10 text-primary" : "bg-black/60 border-white/20 text-primary"
                )}
              >
                <SlidersHorizontal className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <button
              disabled={resetMutation.isPending}
              onClick={() => {
                triggerHaptic('heavy');
                resetMutation.mutate(activeCategory as any || 'all');
              }}
              className={cn(
                "w-full h-12 rounded-[1.2rem] flex items-center justify-center gap-2 transition-all opacity-40 hover:opacity-100 active:scale-95",
                isLight ? "text-black" : "text-white"
              )}
            >
              <RotateCcw className={cn("w-4 h-4", resetMutation.isPending && "animate-spin")} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Factory Reset Sector</span>
            </button>
          </motion.div>
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
