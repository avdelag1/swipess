import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ChevronLeft, Search, RotateCcw, Home, Bike, Briefcase, Zap
} from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { MotoClientFilters } from '@/components/filters/MotoClientFilters';
import { BicycleClientFilters } from '@/components/filters/BicycleClientFilters';
import { WorkerClientFilters } from '@/components/filters/WorkerClientFilters';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { useCardReset } from '@/hooks/useCardReset';

interface ClientFiltersProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export default function ClientFilters({ isEmbedded, onClose }: ClientFiltersProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLight } = useAppTheme();
  
  const activeCategory = useFilterStore(s => s.activeCategory) || 'property';
  const setActiveCategory = useFilterStore(s => s.setActiveCategory);
  const getListingFilters = useFilterStore(s => s.getListingFilters);
  const updateFilters = useFilterStore(s => s.updateFilters);
  const clearFilters = useFilterStore(s => s.clearFilters);

  const [localFilters, setLocalFilters] = useState<Record<string, any>>(getListingFilters());

  const handleApply = useCallback(() => {
    haptics.success();
    updateFilters(localFilters);
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    
    if (isEmbedded && onClose) {
      onClose();
    } else {
      navigate('/client/dashboard');
    }
  }, [navigate, queryClient, updateFilters, localFilters, isEmbedded, onClose]);

  const handleReset = useCallback(() => {
    haptics.tap();
    clearFilters();
    setLocalFilters({});
  }, [clearFilters]);

  const categories = [
    { id: 'property', name: 'Properties', icon: Home },
    { id: 'motorcycle', name: 'Motos', icon: MotorcycleIcon },
    { id: 'bicycle', name: 'Bikes', icon: Bike },
    { id: 'services', name: 'Workers', icon: Briefcase },
  ];

  return (
    <div className={cn(
      "flex flex-col transition-colors duration-500",
      !isEmbedded && "min-h-screen",
      isLight ? (isEmbedded ? "bg-transparent" : "bg-[#F8FAFC]") : (isEmbedded ? "bg-transparent" : "bg-black"),
      isLight ? "text-slate-900" : "text-white"
    )}>
      {!isEmbedded && <div className="pt-24" />}

      {/* 🛸 SECTOR NAVIGATION */}
      <nav className={cn(
        "container mx-auto px-6 py-8 max-w-4xl",
        isEmbedded && "py-4 px-2"
      )}>
        <div className={cn(
          "grid grid-cols-4 gap-3 p-2 rounded-[2.5rem] border",
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/5"
        )}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { haptics.tap(); setActiveCategory(cat.id as any); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 py-5 rounded-[2rem] transition-all duration-300 relative overflow-hidden group",
                  active 
                    ? (isLight ? "bg-slate-900 text-white shadow-xl scale-[1.03] translate-y-[-2px]" : "bg-white text-black shadow-2xl scale-[1.03] translate-y-[-2px]") 
                    : (isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/40 hover:bg-white/5")
                )}
              >
                <Icon className={cn("w-6 h-6", active ? (isLight ? "text-white" : "text-primary") : "opacity-60")} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{cat.name}</span>
                {active && !isLight && (
                  <motion.div 
                    layoutId="active-highlight"
                    className="absolute inset-0 bg-primary/5 pointer-events-none"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 🛸 FILTER GRID */}
      <main className={cn(
        "container mx-auto px-6 max-w-4xl flex-1",
        isEmbedded ? "pb-4" : "pb-48"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "p-6 sm:p-10 rounded-[3.5rem] border backdrop-blur-3xl min-h-[40vh]",
              isLight ? "bg-white border-slate-200 shadow-xl" : "bg-white/[0.02] border-white/5"
            )}
          >
            {activeCategory === 'property' && <PropertyClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
            {activeCategory === 'motorcycle' && <MotoClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
            {activeCategory === 'bicycle' && <BicycleClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
            {activeCategory === 'services' && <WorkerClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 🛸 ENGAGEMENT FOOTER */}
      <div className={cn(
        "px-6 z-50",
        isEmbedded ? "mt-8 pb-12" : "fixed bottom-12 left-0 right-0"
      )}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-20 rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] text-xl shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 group transition-all",
              isLight ? "bg-slate-900 text-white" : "bg-white text-black",
              "hover:bg-primary hover:text-white"
            )}
          >
            <Sparkles className="w-7 h-7 animate-pulse group-hover:scale-110 transition-transform" />
            Engage Intelligence
          </motion.button>
          
          <button 
            onClick={handleReset}
            className={cn(
              "w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity",
              isLight ? "text-black" : "text-white"
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
