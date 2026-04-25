import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeExhaustedStateProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  error?: any;
  isInitialLoad?: boolean;
  role?: 'client' | 'owner';
  radiusKm?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  all:        'All',
  property:   'Properties',
  motorcycle: 'Motorcycles',
  bicycle:    'Bicycles',
  services:   'Services',
  buyers:     'Buyers',
  renters:    'Renters',
  hire:       'Workers',
  worker:     'Workers',
};

export const SwipeExhaustedState = ({
  isRefreshing,
  onRefresh,
  error,
  isInitialLoad = false,
  role = 'client',
  radiusKm = 50
}: SwipeExhaustedStateProps) => {
  const { isLight } = useAppTheme();
  const { setCategories } = useFilterActions();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const setActiveCategory = useFilterStore(s => s.setActiveCategory);
  const [pulseVisible, setPulseVisible] = useState(true);

  useEffect(() => {
    setPulseVisible(true);
    const timer = setTimeout(() => setPulseVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const categoryLabel = CATEGORY_LABELS[activeCategory as keyof typeof CATEGORY_LABELS] || 'All';

  if (error && isInitialLoad) {
    return (
      <div className="relative w-full z-50 flex flex-col items-center justify-center px-4 bg-background" style={{ minHeight: 'calc(100dvh - 120px)' }}>
        <div className="text-center bg-destructive/5 border-destructive/20 p-10 rounded-[3rem] border">
          <div className="text-7xl mb-6">📡</div>
          <h3 className="text-2xl font-black mb-3 text-destructive">Connection Error</h3>
          <p className="text-muted-foreground/80 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
            Could not load listings. Please try again.
          </p>
          <Button onClick={onRefresh} variant="outline" className="gap-3 h-12 px-6 rounded-full text-sm">
            <RotateCcw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6 py-20">
      <div className="flex flex-col items-center text-center max-w-md w-full gap-10">
        
        {/* 🛸 NEXUS STATUS INDICATOR */}
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute inset-0 rounded-full blur-3xl",
              isLight ? "bg-primary/20" : "bg-primary/40"
            )}
            style={{ width: '200px', height: '200px', transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }}
          />
          
          <div className="relative h-32 w-32 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
            />
            <motion.div
              animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.5)]",
                isLight ? "bg-black text-white" : "bg-white text-black"
              )}
            >
              <RotateCcw className="w-8 h-8 animate-spin-slow" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black uppercase tracking-[0.5em] text-primary"
          >
            Nexus Pulse Active
          </motion.p>
          
          <h2 className={cn(
            "text-5xl font-black tracking-tighter uppercase italic leading-[0.9]",
            isLight ? "text-black" : "text-white"
          )}>
            Searching <br />
            <span className="text-primary">{categoryLabel}</span>
          </h2>
          
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest opacity-60">
            Expanding sector depth to {radiusKm} KM
          </p>
        </div>

        {/* Action HUD */}
        <div className="flex flex-col w-full gap-4 pt-4">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              const cycle = role === 'owner'
                ? ['buyers', 'renters', 'hire']
                : ['property', 'motorcycle', 'bicycle', 'services'];
              const currentIdx = cycle.indexOf(activeCategory as any);
              const nextIdx = (currentIdx + 1) % cycle.length;
              setActiveCategory(cycle[nextIdx] as any);
              setCategories([cycle[nextIdx]] as any);
            }}
      {/* 🚀 ACTION NEXUS */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRefresh}
          className={cn(
            "w-full h-16 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all",
            isLight ? "bg-black text-white" : "bg-white text-black"
          )}
        >
          {isRefreshing ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          <span>Recalibrate Radar</span>
        </motion.button>

        {/* 🛸 BACK TO SECTORS - ADDED FOR PERSISTENCE */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // Trigger sector reset via state if prop not provided
            // This ensures user can always get back to the poker cards
            const setActiveCategory = useFilterStore.getState().setActiveCategory;
            setActiveCategory(null);
          }}
          className={cn(
            "w-full h-14 rounded-[2rem] font-black uppercase italic tracking-[0.2em] border transition-all flex items-center justify-center gap-3",
            isLight ? "bg-white/50 border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Switch Sector</span>
        </motion.button>
      </div>
      </div>
    </div>
  );
};
