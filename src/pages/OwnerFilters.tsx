import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Target, Sparkles, Home, Briefcase, Zap, RotateCcw, Bike
} from 'lucide-react';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import useAppTheme from '@/hooks/useAppTheme';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';

type CategoryType = 'property' | 'motorcycle' | 'bicycle' | 'services';

interface OwnerFiltersProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export default function OwnerFilters({ isEmbedded, onClose }: OwnerFiltersProps) {
  const navigate = useNavigate();
  const { theme, isLight } = useAppTheme();
  const isDark = theme === 'dark' || theme === 'swipess-style';
  
  const storeActiveCategory = useFilterStore(s => s.activeCategory);
  const [activeCategory, setActiveCategory] = useState<CategoryType>((storeActiveCategory as CategoryType) || 'property');

  const isFirstMount = useRef(true);

  const handleApply = useCallback((filters?: any) => {
    // If this is the initial auto-apply from DiscoveryFilters, just skip navigation
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    haptics.success();
    if (isEmbedded && onClose) {
      onClose();
    } else {
      navigate('/owner/dashboard');
    }
  }, [isEmbedded, onClose, navigate]);

  const handleReset = useCallback(() => {
    haptics.tap();
    // Implementation for reset if needed
  }, []);

  const categories = [
    { id: 'property', name: 'Leads', icon: Home },
    { id: 'motorcycle', name: 'Motos', icon: MotorcycleIcon },
    { id: 'bicycle', name: 'Bikes', icon: Bike },
    { id: 'services', name: 'Jobs', icon: Briefcase },
  ];

  const content = (
    <div className={cn(
      "flex flex-col h-full",
      !isEmbedded && (isLight ? "bg-[#F8FAFC] text-slate-900" : "bg-black text-white")
    )}>
      {/* HEADER - Only in standalone */}
      {!isEmbedded && (
        <div className="pt-24 px-6 flex items-center justify-between">
           <button 
             onClick={() => navigate(-1)}
             className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/10"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           <h1 className="text-xl font-black uppercase italic tracking-widest">Filter Matrix</h1>
           <button 
             onClick={handleReset}
             className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/10"
           >
             <RotateCcw className="w-5 h-5" />
           </button>
        </div>
      )}

      {/* 🛸 SECTOR NAVIGATION */}
      <nav className={cn(
        "container mx-auto px-6 py-6 max-w-4xl",
        isEmbedded ? "px-0" : ""
      )}>
        <div className={cn(
          "grid grid-cols-4 gap-2 p-1.5 rounded-[2.5rem] border",
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/5"
        )}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { haptics.tap(); setActiveCategory(cat.id as CategoryType); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-4 rounded-[2rem] transition-all duration-300 relative overflow-hidden group",
                  active 
                    ? (isLight ? "bg-slate-900 text-white shadow-xl scale-[1.03]" : "bg-white text-black shadow-2xl scale-[1.03]") 
                    : (isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/40 hover:bg-white/5")
                )}
              >
                <Icon className={cn("w-5 h-5", active ? (isLight ? "text-white" : "text-primary") : "opacity-60")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{cat.name}</span>
                {active && !isLight && (
                  <motion.div 
                    layoutId="active-owner-highlight"
                    className="absolute inset-0 bg-primary/5 pointer-events-none"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 🛸 RADAR CALIBRATION GRID */}
      <main className={cn(
        "container mx-auto px-6 max-w-4xl flex-1 overflow-y-auto pb-32",
        isEmbedded ? "px-0" : ""
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "p-6 md:p-10 rounded-[3rem] border backdrop-blur-3xl",
              isLight ? "bg-white border-slate-200 shadow-xl" : "bg-white/[0.02] border-white/5"
            )}
          >
            {(() => {
              const mappedCategory = 
                activeCategory === 'leads' ? 'property' :
                activeCategory === 'motos' ? 'motorcycle' :
                activeCategory === 'bikes' ? 'bicycle' :
                activeCategory === 'jobs' ? 'service' :
                activeCategory === 'services' ? 'service' :
                'property';
                
              return (
                <DiscoveryFilters 
                  category={mappedCategory as any} 
                  onApply={handleApply} 
                  activeCount={0}
                  hideApplyButton={true}
                />
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 🛸 ENGAGEMENT FOOTER */}
      <div className={cn(
        "fixed bottom-8 left-0 right-0 px-6 z-50",
        isEmbedded ? "relative bottom-auto px-0 mt-8" : ""
      )}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-16 md:h-20 rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] text-lg md:text-xl shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 group transition-all",
              isLight ? "bg-slate-900 text-white" : "bg-white text-black",
              "hover:bg-primary hover:text-white"
            )}
          >
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 animate-pulse group-hover:scale-110 transition-transform" />
            Initiate Radar Scan
          </motion.button>
        </div>
      </div>
    </div>
  );

  return isEmbedded ? content : <div className="min-h-screen">{content}</div>;
}

