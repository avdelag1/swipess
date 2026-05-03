import { useMemo, useState } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useSmartListingMatching } from '@/hooks/smartMatching/useSmartListingMatching';
import { useAuth } from '@/hooks/useAuth';
import { ClientInsightsDashboard } from '@/components/ClientInsightsDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const { isLight } = useAppTheme();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'discovery' | 'insights'>('discovery');

  const filterVersion = useFilterStore(s => s.filterVersion);
  const filters = useMemo(
    () => useFilterStore.getState().getListingFilters(),
    [filterVersion]
  );

  // Pre-fetch listing data so the swipe deck is ready instantly
  useSmartListingMatching(user?.id, [], filters, 0, 20, false);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col relative w-full min-h-0",
        isLight ? "bg-white" : "bg-[#020202]"
      )}
      style={{
        willChange: 'transform',
      }}
    >
      {/* 🛸 NEXUS DASHBOARD TOGGLE */}
      <div className="absolute top-[calc(var(--top-bar-height,60px)+12px)] left-1/2 -translate-x-1/2 z-[40] flex p-1 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl">
        <button
          onClick={() => { setViewMode('discovery'); triggerHaptic('light'); }}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            viewMode === 'discovery' ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.4)]" : "text-white/40 hover:text-white/60"
          )}
        >
          Discovery
        </button>
        <button
          onClick={() => { setViewMode('insights'); triggerHaptic('light'); }}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            viewMode === 'insights' ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.4)]" : "text-white/40 hover:text-white/60"
          )}
        >
          Insights
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'discovery' ? (
          <motion.div
            key="discovery"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col min-h-0"
          >
            <SwipessSwipeContainer
              onListingTap={() => {}}
              onInsights={() => {}}
              onMessageClick={onMessageClick}
            />
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 overflow-y-auto pt-20"
          >
            <ClientInsightsDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

