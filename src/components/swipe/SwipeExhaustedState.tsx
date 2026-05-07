import { cn } from '@/lib/utils';
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
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-black px-5 py-5 overflow-hidden">
      <div className="absolute inset-3 rounded-[2rem] border border-white/25 bg-white/[0.04] shadow-[0_30px_90px_rgba(0,0,0,0.6)] pointer-events-none" />
      <div className="flex flex-col items-center text-center w-full max-w-md gap-5 relative z-10 px-2">
        {/* Message */}
        <div className="space-y-3">
          <h2 className={cn(
            "text-2xl sm:text-3xl font-black tracking-tight uppercase text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          )}>
            {isLoading ? 'Scanning…' : `No ${categoryName} found nearby`}
          </h2>
          <p className={cn(
            "text-xs font-bold uppercase tracking-[0.25em] text-white/75"
          )}>
            {isLoading ? 'Initializing sector scan' : 'Adjust radius or try another category'}
          </p>
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
                  "absolute top-0 right-0 z-10 w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 border border-white/30 bg-white shadow-[0_18px_40px_rgba(255,255,255,0.18)] hover:bg-white/90"
                )}
                title="Open advanced filters"
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className="w-5 h-5 text-black" />
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

        <p className="text-xs font-semibold text-white/70">
          Move the slider to search further
        </p>

        {/* Quick filter switcher — allows changing category without going back */}
        {onCategoryChange && (
          <div className="w-full space-y-3 mt-2">
            <p className={cn(
              "text-[11px] font-black uppercase tracking-[0.25em] text-white/85"
            )}>
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
                    "min-h-12 py-2 px-3 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 border shadow-[0_16px_34px_rgba(0,0,0,0.5)]",
                    activeCategory === cat.id
                      ? "bg-white text-black border-white"
                      : "bg-white text-black border-white/40 hover:bg-white/90"
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
