import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { DistanceSlider } from './DistanceSlider';
import { SlidersHorizontal, MapPin } from 'lucide-react';
import useAppTheme from '@/hooks/useAppTheme';

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

  const allCategories = role === 'owner' ? ownerCategories : clientCategories;
  const categories = allCategories.filter((c) => c.id !== activeCategory);

  const headingColor = isLight ? 'text-slate-900' : 'text-white';
  const subColor = isLight ? 'text-slate-500' : 'text-white/60';
  const sectionLabelColor = isLight ? 'text-slate-500' : 'text-white/55';
  const filterBtnClass = isLight
    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
    : 'bg-white text-slate-900 border-white hover:bg-white/90';
  const categoryBtnClass = isLight
    ? 'bg-white text-slate-900 border-slate-200 shadow-[0_8px_22px_-12px_rgba(15,23,42,0.18)] hover:bg-slate-50'
    : 'bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.10]';

  return (
    <div
      className={cn(
        'relative z-50 h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden',
        isLight ? 'bg-white' : 'bg-[#0a0a0c]'
      )}
    >
      <div className="flex flex-col items-center text-center w-full max-w-md gap-7 relative z-10">
        {/* Headline */}
        <div className="space-y-2">
          <h2 className={cn('text-[26px] sm:text-[30px] font-black tracking-tight leading-tight', headingColor)}>
            {isLoading ? 'Scanning…' : `No ${categoryName} found nearby`}
          </h2>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', subColor)}>
            {isLoading ? 'Initializing sector scan' : 'Adjust radius or try another category'}
          </p>
        </div>

        {/* Radius card */}
        {onRadiusChange && onDetectLocation && (
          <div
            className={cn(
              'w-full rounded-[1.75rem] p-5 pt-6 relative',
              isLight
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-white/[0.04] border border-white/10'
            )}
          >
            {/* Filter pill — top-right, isolated */}
            {onOpenFilters && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenFilters();
                }}
                className={cn(
                  'absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full border transition-all active:scale-90',
                  filterBtnClass
                )}
                title="Open advanced filters"
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}

            <div className={cn('flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] mb-3', sectionLabelColor)}>
              <MapPin className="w-3.5 h-3.5" />
              <span>Search radius</span>
            </div>

            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />

            <p className={cn('text-[11px] font-semibold mt-4', subColor)}>
              Move the slider to search further
            </p>
          </div>
        )}

        {/* Category switcher */}
        {onCategoryChange && categories.length > 0 && (
          <div className="w-full space-y-3">
            <p className={cn('text-[10px] font-black uppercase tracking-[0.22em]', sectionLabelColor)}>
              Or try another
            </p>
            <div className={cn('grid gap-2', categories.length >= 3 ? 'grid-cols-3' : categories.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    onCategoryChange(cat.id);
                  }}
                  className={cn(
                    'min-h-12 py-2.5 px-3 rounded-full text-[11px] font-black uppercase tracking-[0.12em] transition-all active:scale-95 border',
                    categoryBtnClass
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
