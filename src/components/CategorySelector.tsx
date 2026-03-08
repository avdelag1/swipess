import { Bike, Home, CircleDot, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Category = 'property' | 'motorcycle' | 'bicycle' | 'worker';
export type Mode = 'sale' | 'rent' | 'both';

interface CategorySelectorProps {
  selectedCategory: Category;
  selectedMode: Mode;
  onCategoryChange: (category: Category) => void;
  onModeChange: (mode: Mode) => void;
  className?: string;
}

export function CategorySelector({
  selectedCategory,
  selectedMode,
  onCategoryChange,
  onModeChange,
  className = ''
}: CategorySelectorProps) {
  const categories = [
    { value: 'property' as Category, label: 'Properties', icon: Home },
    { value: 'motorcycle' as Category, label: 'Motorcycles', icon: CircleDot },
    { value: 'bicycle' as Category, label: 'Bicycles', icon: Bike },
    { value: 'worker' as Category, label: 'Workers', icon: Briefcase },
  ];

  // Cascade toggle: clicking a mode toggles it on/off with "both" as the combined state.
  // - If only rent is on and you click sale → both
  // - If only sale is on and you click rent → both
  // - If both are on and you click rent → sale only
  // - If both are on and you click sale → rent only
  // - Clicking the sole active mode → keep it (can't deselect all)
  const handleModeClick = (clicked: 'rent' | 'sale') => {
    if (selectedMode === 'both') {
      onModeChange(clicked === 'rent' ? 'sale' : 'rent');
    } else if (selectedMode === clicked) {
      // Already the only active one — activate both
      onModeChange('both');
    } else {
      onModeChange('both');
    }
  };

  const rentActive = selectedMode === 'rent' || selectedMode === 'both';
  const saleActive = selectedMode === 'sale' || selectedMode === 'both';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(({ value, label, icon: Icon }) => {
          const active = selectedCategory === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onCategoryChange(value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 border active:scale-[0.96]',
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Mode Toggle — supports rent, sale, or both */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleModeClick('rent')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border active:scale-[0.96]',
            rentActive
              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
              : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground'
          )}
        >
          🏠 For Rent
        </button>
        <button
          type="button"
          onClick={() => handleModeClick('sale')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border active:scale-[0.96]',
            saleActive
              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
              : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground'
          )}
        >
          💰 For Sale
        </button>
        {selectedMode === 'both' && (
          <span className="text-xs text-muted-foreground italic">Both selected</span>
        )}
      </div>
    </div>
  );
}
