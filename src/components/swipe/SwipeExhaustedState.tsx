import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { DistanceSlider } from './DistanceSlider';
import { SlidersHorizontal, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SwipeExhaustedStateProps {
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
  categoryName?: string;
  isLoading?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onOpenFilters?: () => void;
  role?: 'client' | 'owner';
  [key: string]: any;
}

export const SwipeExhaustedState = ({
  radiusKm = 50,
  onRadiusChange,
  onDetectLocation,
  detecting = false,
  detected = false,
  categoryName = 'listings',
  isLoading = false,
  activeCategory = 'property',
  onCategoryChange,
  onOpenFilters,
  role = 'client',
}: SwipeExhaustedStateProps) => {
  const { isLight } = useAppTheme();

  const clientCategories = [
    { id: 'property', label: 'Properties' },
    { id: 'motorcycle', label: 'Motorcycles' },
    { id: 'bicycle', label: 'Bicycles' },
    { id: 'services', label: 'Workers' },
  ];

  const ownerCategories = [
    { id: 'buyers', label: 'Buyers' },
    { id: 'renters', label: 'Renters' },
    { id: 'hire', label: 'Workers' },
  ];

  // Filter out the active category so the grid doesn't show "switch to current"
  const allCategories = role === 'owner' ? ownerCategories : clientCategories;
  const categories = allCategories.filter((c) => c.id !== activeCategory);

  return (
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6 overflow-hidden">
      {/* Discovery Pulse Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {(isLoading || !detected) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex items-center justify-center"
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ 
                    scale: [0.5, 2.5], 
                    opacity: [0.3, 0] 
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    delay: i * 0.8,
                    ease: "easeOut" 
                  }}
                  className={cn(
                    "absolute rounded-full border border-primary/40",
                    i === 1 ? "w-40 h-40" : i === 2 ? "w-60 h-60" : "w-80 h-80"
                  )}
                />
              ))}
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative z-10 w-24 h-24 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.2)]"
              >
                <Search className="w-8 h-8 text-primary opacity-60" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center text-center w-full max-w-md gap-6 relative z-10">
        {/* Message */}
        <div className="space-y-2">
          <p className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] mb-1 italic",
            isLoading ? (isLight ? "text-black/60" : "text-white/40") : "text-primary drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]"
          )}>
            {isLoading ? `Initializing Sector Scan...` : `No ${categoryName} Found Nearby`}
          </p>
          <h2 className={cn("text-3xl font-black tracking-tight uppercase italic", isLight ? "text-black" : "text-white")}>
            {isLoading ? 'Scanning...' : 'Adjust Radius'}
          </h2>
        </div>

        {/* Distance slider — centered, the main control */}
        {onRadiusChange && onDetectLocation && (
          <div className="w-full relative pt-12">
            {/* Main filter icon button — top-right of slider, isolated above slider content */}
            {onOpenFilters && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenFilters();
                }}
                className={cn(
                  "absolute top-0 right-0 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 border",
                  isLight ? "bg-white border-black/20 shadow-md hover:bg-gray-50" : "bg-white/10 border-white/15 hover:bg-white/20"
                )}
                title="Open advanced filters"
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className={cn("w-4 h-4", isLight ? "text-black" : "text-primary")} />
              </button>
            )}

            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
          </div>
        )}

        <p className={cn("text-xs font-bold", isLight ? "text-black/60" : "text-white/40")}>
          Move the slider to search further
        </p>

        {/* Quick filter switcher — allows changing category without going back */}
        {onCategoryChange && (
          <div className="w-full space-y-2 mt-2">
            <p className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-black" : "text-white")}>
              Or try another
            </p>
            <div className={cn(
              "grid gap-2",
              categories.length >= 3 ? 'grid-cols-3' : categories.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
            )}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    onCategoryChange(cat.id);
                  }}
                  className={cn(
                    "py-2 px-3 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 border shadow-sm",
                    activeCategory === cat.id
                      ? isLight
                        ? "bg-black text-white border-black"
                        : "bg-white/20 text-white border-white/30"
                      : isLight
                      ? "bg-white text-black border-black/20 hover:bg-gray-50"
                      : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
