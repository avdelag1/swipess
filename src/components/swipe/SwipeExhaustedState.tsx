import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deckFadeVariants } from '@/utils/modernAnimations';
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
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsSearching(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const categoryLabel = CATEGORY_LABELS[activeCategory as keyof typeof CATEGORY_LABELS] || 'Opportunities';

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
        className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6"
      >
        {/* Content centered vertically */}
        <div className="flex flex-col items-center text-center max-w-md z-10 w-full py-8">
          {/* Logo */}
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            src="/icons/Swipess-wordmark-white.svg"
            alt="Swipess"
            className={cn("h-12 mb-12 object-contain", isLight && "invert")}
          />

          {/* Searching Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 mb-12"
          >
            <h2 className={cn(
              "text-3xl font-black tracking-tight leading-tight",
              isLight ? "text-black" : "text-white"
            )}>
              Searching for {categoryLabel}
            </h2>
          </motion.div>

          {/* Pulsing Animation - only shows for 5 seconds */}
          {isSearching && (
            <motion.div
              className="mb-12"
              animate={{ scale: [1, 1.15], opacity: [0.6, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={cn(
                "w-20 h-20 rounded-full",
                isLight ? "bg-black/20" : "bg-white/20"
              )} />
            </motion.div>
          )}

          {/* Distance/Radius Info — PROMINENT */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "mb-10 px-6 py-3 rounded-full font-black uppercase tracking-wider border",
              isLight
                ? "bg-black/10 text-black border-black/20"
                : "bg-white/10 text-white border-white/20"
            )}
          >
            {radiusKm} km radius
          </motion.div>

          {/* Change Sector Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              triggerHaptic('heavy');
              const cycle = role === 'owner'
                ? ['buyers', 'renters', 'hire']
                : ['property', 'motorcycle', 'bicycle', 'services'];
              const currentIdx = cycle.indexOf(activeCategory as any);
              const nextIdx = (currentIdx + 1) % cycle.length;
              setActiveCategory(cycle[nextIdx] as any);
              setCategories([cycle[nextIdx]] as any);
              setIsSearching(true);
            }}
            className={cn(
              "px-8 py-3 rounded-full font-black uppercase text-sm transition-all active:scale-95 border",
              isLight
                ? "bg-black text-white border-white/20 hover:bg-black/90"
                : "bg-white text-black border-black/10 hover:bg-white/90"
            )}
          >
            Change Sector
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
