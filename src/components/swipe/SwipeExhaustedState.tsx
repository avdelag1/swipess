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
    { id: 'hire', label: 'Workers' },
  ];

  const categories = role === 'owner' ? ownerCategories : clientCategories;

  return (
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6">
      <div className="flex flex-col items-center text-center w-full max-w-md gap-6">
        {/* Message */}
        <div className="space-y-2">
          <p className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-black/50" : "text-white/50")}>
            No {categoryName} found nearby
          </p>
          <h2 className={cn("text-2xl font-black tracking-tight", isLight ? "text-black" : "text-white")}>
            Adjust your distance
          </h2>
        </div>

        {/* Distance slider — centered, the main control */}
        {onRadiusChange && onDetectLocation && (
          <div className={cn(
            "w-full rounded-3xl border p-3 relative",
            isLight ? "bg-white border-black/10" : "bg-white/5 border-white/10"
          )}>
            {/* Main filter icon button — top-right of slider */}
            {onOpenFilters && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenFilters();
                }}
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-lg transition-all active:scale-90",
                  isLight ? "hover:bg-black/5" : "hover:bg-white/10"
                )}
                title="Open advanced filters"
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
            <div className="grid grid-cols-2 gap-2">
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
