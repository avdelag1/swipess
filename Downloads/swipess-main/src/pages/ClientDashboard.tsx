import { useCallback } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { VapIdCardModal } from '@/components/VapIdCardModal';
import { ShieldCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
}

/**
 * Client Dashboard — Poker card fan when no category selected,
 * full swipe deck when a category is active.
 */
export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
}: ClientDashboardProps) {
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setCategories } = useFilterActions();
  const [isVapModalOpen, setIsVapModalOpen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background relative">
      
      {/* VAP ID Trigger Button */}
      <button
        onClick={() => setIsVapModalOpen(true)}
        className={cn(
          "absolute top-6 right-6 z-40 p-3 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-transform active:scale-95",
          isLight ? "bg-white/80 border border-black/5 text-primary" : "bg-black/40 border border-white/10 text-white"
        )}
      >
        <ShieldCheck className="w-6 h-6" />
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary" />
      </button>

      <VapIdCardModal 
        isOpen={isVapModalOpen} 
        onClose={() => setIsVapModalOpen(false)} 
      />

      <AnimatePresence mode="wait">
        {!activeCategory ? (
          <motion.div 
            key="dash-fan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden"
          >
            <SwipeAllDashboard setCategories={(ids) => {
              if (ids.length > 0) {
                setCategories(ids);
              }
            }} />
          </motion.div>
        ) : (
          <motion.div 
            key="dash-swipe"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            <SwipessSwipeContainer
              onListingTap={handleListingTap}
              onInsights={handleListingTap}
              onMessageClick={onMessageClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
