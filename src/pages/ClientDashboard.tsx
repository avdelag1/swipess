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
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { SwipessLogo } from '@/components/SwipessLogo';

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
      <AtmosphericLayer variant="nexus" />

      {/* 🛸 NEXUS DASHBOARD TOGGLE */}
      {(!activeCategory || viewMode === 'insights') && (
        <div className="absolute top-[calc(var(--top-bar-height,60px)+12px)] left-1/2 -translate-x-1/2 z-[40] flex p-1 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl min-w-[200px]">
          {/* Sliding Indicator */}
          <motion.div
            className="absolute h-9 rounded-xl z-0"
            initial={false}
            animate={{
              x: viewMode === 'discovery' ? 4 : 100,
              width: 96,
              background: viewMode === 'discovery' 
                ? 'linear-gradient(135deg, #FF4D00, #FF6B00)' 
                : 'linear-gradient(135deg, #EB4898, #C026D3)',
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            style={{
              boxShadow: viewMode === 'discovery' 
                ? '0 4px 15px rgba(255,77,0,0.3)' 
                : '0 4px 15px rgba(235,72,152,0.3)',
            }}
          />

          <button
            onClick={() => { setViewMode('discovery'); triggerHaptic('light'); }}
            className={cn(
              "flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10",
              viewMode === 'discovery' ? "text-white" : "text-white/40 hover:text-white/60"
            )}
          >
            Discovery
          </button>
          <button
            onClick={() => { setViewMode('insights'); triggerHaptic('light'); }}
            className={cn(
              "flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10",
              viewMode === 'insights' ? "text-white" : "text-white/40 hover:text-white/60"
            )}
          >
            Insights
          </button>
        </div>
      )}

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

