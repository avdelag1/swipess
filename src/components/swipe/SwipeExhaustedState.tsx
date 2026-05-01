import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { DistanceSlider } from './DistanceSlider';
import { SlidersHorizontal } from 'lucide-react';

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
    { id: 'services', label: 'Services' },
  ];

  const ownerCategories = [
    { id: 'buyers', label: 'Buyers' },
    { id: 'renters', label: 'Renters' },
    { id: 'hire', label: 'Services' },
  ];

  // Filter out the active category so the grid doesn't show "switch to current"
  const allCategories = role === 'owner' ? ownerCategories : clientCategories;
  const categories = allCategories.filter((c) => c.id !== activeCategory);

  return (
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6 pt-16">
      <div className="flex flex-col items-center text-center w-full max-w-md gap-6">
        {/* Message */}
        <div className="space-y-2">
          <p className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] mb-1 italic",
            isLoading ? (isLight ? "text-black/40" : "text-white/40") : "text-primary drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]"
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
                  isLight ? "bg-white/80 border-black/10 hover:bg-white" : "bg-white/10 border-white/15 hover:bg-white/20"
                )}
                title="Open advanced filters"
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
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

        <p className={cn("text-xs", isLight ? "text-black/40" : "text-white/40")}>
          Move the slider to search further
        </p>

        {/* Quick filter switcher — allows changing category without going back */}
        {onCategoryChange && (
          <div className="w-full space-y-2 mt-2">
            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50", isLight ? "text-black" : "text-white")}>
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
                    "py-2 px-3 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 border",
                    activeCategory === cat.id
                      ? isLight
                        ? "bg-black text-white border-black/30"
                        : "bg-white/20 text-white border-white/30"
                      : isLight
                      ? "bg-white/50 text-black border-black/10 hover:bg-white/70"
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
