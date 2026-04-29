import { useState, useCallback } from 'react';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ChevronLeft, ChevronRight, Search, RotateCcw, Home, Bike, Briefcase, Zap, Radar
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
  const { navigate } = useAppNavigate();

  const queryClient = useQueryClient();
  const { isLight } = useAppTheme();
  
  const activeCategory = useFilterStore(s => s.activeCategory);
  const setActiveCategory = useFilterStore(s => s.setActiveCategory);
  const getListingFilters = useFilterStore(s => s.getListingFilters);
  const updateFilters = useFilterStore(s => s.updateFilters);
  const resetClientFilters = useFilterStore(s => s.resetClientFilters);

  const [localFilters, setLocalFilters] = useState<Record<string, any>>(getListingFilters());
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = useCallback(() => {
    haptics.success();
    setIsScanning(true);
    updateFilters(localFilters);
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    
    setTimeout(() => {
      setIsScanning(false);
      if (isEmbedded && onClose) {
        onClose();
      } else {
        navigate('/client/dashboard');
      }
    }, 1000);
  }, [navigate, queryClient, updateFilters, localFilters, isEmbedded, onClose]);

  const handleReset = useCallback(() => {
    haptics.tap();
    resetClientFilters();
    setLocalFilters({});
  }, [resetClientFilters]);

  const CATEGORIES = [
    { id: 'property', label: 'Properties', desc: 'Settle Anywhere', icon: Home },
    { id: 'motorcycle', label: 'Motos', desc: 'High Velocity', icon: MotorcycleIcon },
    { id: 'bicycle', label: 'Bikes', desc: 'Urban Agility', icon: Bike },
    { id: 'services', label: 'Workers', desc: 'Elite Skillset', icon: Briefcase },
  ];

  return (
    <div
      className={cn(
        "w-full flex flex-col p-4 relative min-h-screen",
        isLight ? "bg-white text-slate-900" : "bg-[#020202] text-white"
      )}
      style={{ paddingBottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 24px)' }}
    >
      {!isEmbedded && (
        <div className="mb-6 pt-4">
          <h1 className={cn(
            "text-4xl font-black uppercase italic tracking-[-0.05em] leading-none",
            isLight ? "text-slate-900" : "text-white"
          )}>
            Swipess <span className="text-primary">Filter</span>
          </h1>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-1",
            isLight ? "text-slate-900" : "text-white"
          )}>Filter Your Best Deal</p>
        </div>
      )}

      {/* 🛸 RADAR CALIBRATION GRID */}
      <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-200 relative z-10">
        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 gap-4 pt-4"
            >
              {/* Back to previous page */}
              <button
                onClick={() => { haptics.tap(); navigate(-1); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-90 w-fit",
                  isLight ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/10"
                )}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "group relative h-28 w-full rounded-[2.5rem] overflow-hidden border transition-all duration-300 active:scale-[0.97]",
                    isLight 
                      ? "bg-white border-slate-200 shadow-xl" 
                      : "bg-white/5 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative h-full px-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                        isLight ? "bg-slate-900 text-white" : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      )}>
                        <cat.icon className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <h3 className={cn(
                          "text-xl font-black uppercase italic tracking-tight",
                          isLight ? "text-slate-900" : "text-white"
                        )}>{cat.label}</h3>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest opacity-40",
                          isLight ? "text-slate-900" : "text-white"
                        )}>{cat.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-6 h-6 transition-transform group-hover:translate-x-2",
                      isLight ? "text-slate-400" : "text-white/30"
                    )} />
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 pb-20"
            >
              <button
                onClick={() => { haptics.tap(); setActiveCategory(null); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-90",
                  isLight
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-white hover:bg-white/10"
                )}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {/* Category switcher */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all active:scale-95 whitespace-nowrap"
                    style={activeCategory === cat.id ? {
                      backgroundColor: '#FF4D00',
                      borderColor: '#FF4D00',
                      color: 'white'
                    } : {
                      backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                      borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                      color: isLight ? '#000000' : '#ffffff'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <h2 className={cn(
                "text-5xl font-black uppercase italic tracking-[-0.05em] mb-2",
                isLight ? "text-slate-900" : "text-white"
              )}>
                {activeCategory === 'property' && 'Property'}
                {activeCategory === 'motorcycle' && 'Moto'}
                {activeCategory === 'bicycle' && 'Bicycle'}
                {activeCategory === 'services' && 'Worker'}
                <span className="text-primary block text-xl tracking-[0.2em] mt-2">Calibration</span>
              </h2>

              <div className={cn(
                "rounded-[3rem] p-6 shadow-2xl",
                isLight ? "bg-white border border-slate-100" : "bg-white/5 border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              )}>
                {activeCategory === 'property' && <PropertyClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'motorcycle' && <MotoClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'bicycle' && <BicycleClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'services' && <WorkerClientFilters onApply={(f) => setLocalFilters(f)} initialFilters={localFilters} activeCount={0} />}
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className={cn(
                    "w-full h-20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 group transition-all active:scale-95",
                    isLight ? "bg-slate-900 text-white" : "bg-white text-black",
                    "hover:bg-primary hover:text-white disabled:opacity-50 overflow-hidden relative"
                  )}
                >
                  {isScanning && (
                    <motion.div 
                      className="absolute inset-0 bg-primary/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <Radar className={cn("w-6 h-6", isScanning && "animate-spin")} />
                  <span className="text-lg font-black uppercase italic tracking-widest">
                    {isScanning ? 'Synchronizing...' : 'Initiate Scan'}
                  </span>
                </button>

                <button
                  onClick={() => { handleReset(); setActiveCategory(null); }}
                  className={cn(
                    "w-full h-16 rounded-[2rem] flex items-center justify-center gap-2 transition-all",
                    isLight ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Reset Parameters</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-3xl bg-black/80"
            >
              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Outer Glow */}
                <motion.div 
                  className="absolute inset-0 rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #ec4899 0%, transparent 25%, transparent 100%)',
                    opacity: 0.4
                  }}
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <Radar className="w-16 h-16 text-primary animate-pulse mb-4" />
                  <h2 className="text-2xl font-black uppercase italic tracking-[0.4em] text-white animate-pulse">Scanning</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em] mt-2">Proximity Sync</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
