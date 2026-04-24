import { useState, useCallback, useRef } from 'react';
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
  const isDark = theme === 'dark' || theme === 'Swipess-style';
  
  const storeActiveCategory = useFilterStore(s => s.activeCategory);
  const [activeCategory, setActiveCategory] = useState<CategoryType>((storeActiveCategory as CategoryType) || 'property');
  const [isScanning, setIsScanning] = useState(false);

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
      "flex flex-col transition-colors duration-500 overflow-y-auto",
      !isEmbedded && "min-h-screen pb-48",
      isLight ? (isEmbedded ? "bg-transparent" : "bg-[#F8FAFC]") : (isEmbedded ? "bg-transparent" : "bg-black"),
      isLight ? "text-slate-900" : "text-white"
    )}>
      {/* HEADER - Only in standalone */}
      {!isEmbedded && (
        <div className="pt-32 px-6 flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90",
                isLight ? "bg-black/5 border-black/10 text-black" : "bg-white/10 border-white/10 text-white"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className={cn(
              "text-xl font-black uppercase italic tracking-widest",
              isLight ? "text-slate-900" : "text-white"
            )}>RADAR NEXUS</h1>
            <button 
              onClick={handleReset}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90",
                isLight ? "bg-black/5 border-black/10 text-black" : "bg-white/10 border-white/10 text-white"
              )}
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
                (activeCategory as string) === 'leads' ? 'property' :
                (activeCategory as string) === 'motos' ? 'motorcycle' :
                (activeCategory as string) === 'bikes' ? 'bicycle' :
                (activeCategory as string) === 'jobs' ? 'service' :
                (activeCategory as string) === 'services' ? 'service' :
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
        "px-6 z-50",
        isEmbedded ? "mt-8 pb-12" : "fixed bottom-12 left-0 right-0"
      )}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsScanning(true);
              setTimeout(() => {
                handleApply();
                setIsScanning(false);
              }, 2200);
            }}
            disabled={isScanning}
            className={cn(
              "w-full h-20 rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] text-xl shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 group transition-all",
              isLight ? "bg-slate-900 text-white" : "bg-white text-black",
              "hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Sparkles className={cn("w-6 h-6 md:w-7 md:h-7 animate-pulse group-hover:scale-110 transition-transform", isScanning && "animate-spin")} />
            <span className="text-sm font-black uppercase italic tracking-[0.2em]">
              {isScanning ? 'CALIBRATING...' : 'INITIATE RADAR SCAN'}
            </span>
          </motion.button>

          <button 
            onClick={handleReset}
            className={cn(
              "w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity",
              isLight ? "text-black" : "text-white"
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Reset Radar
          </button>
        </div>
      </div>

      {/* 🛸 CINEMATIC SCANNING OVERLAY */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl pointer-events-auto"
          >
            {/* Pulsing Core */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]"
            />
            
            {/* Scanning Ring */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-4 border border-white/20 rounded-full"
              />
              <Target className="w-16 h-16 text-primary animate-pulse" strokeWidth={1} />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-12 text-center"
            >
              <h2 className="text-2xl font-black uppercase italic tracking-[0.4em] text-white">Calibrating Radar</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mt-2">Accessing Global Node Matrix...</p>
            </motion.div>

            {/* Scanning Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(255,107,53,0.8)] z-10 opacity-40"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return isEmbedded ? content : <div className="min-h-screen">{content}</div>;
}

