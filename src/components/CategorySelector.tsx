import { Bike, Home, CircleDot, Briefcase } from 'lucide-react';

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

  const modes = [
    { value: 'rent' as Mode, label: 'For Rent', emoji: '🏠' },
    { value: 'sale' as Mode, label: 'For Sale', emoji: '💰' },
  ];

  // Cascade mode toggle logic
  const handleModeToggle = (clicked: 'rent' | 'sale') => {
    if (selectedMode === 'both') {
      // Both active → deselect clicked, keep the other
      onModeChange(clicked === 'rent' ? 'sale' : 'rent');
    } else if (selectedMode === clicked) {
      // Same mode clicked → no-op (must have at least one)
      return;
    } else {
      // Other mode is active → activate both
      onModeChange('both');
    }
  };

  const isModeActive = (mode: 'rent' | 'sale') =>
    selectedMode === mode || selectedMode === 'both';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(({ value, label, icon: Icon }) => {
          const active = selectedCategory === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onCategoryChange(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96] border ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-card/60 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Mode Toggle — cascade */}
      <div className="flex gap-2">
        {modes.map(({ value, label, emoji }) => {
          const active = isModeActive(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleModeToggle(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96] border cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-card/60 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {emoji} {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
