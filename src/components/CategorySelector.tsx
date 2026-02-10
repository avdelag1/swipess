import { Bike, Home, CircleDot, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={selectedCategory === value ? 'default' : 'outline'}
            onClick={() => onCategoryChange(value)}
            className="flex items-center gap-2 transition-all"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {modes.map(({ value, label, emoji }) => (
          <Badge
            key={value}
            variant={selectedMode === value || selectedMode === 'both' ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
            onClick={() => onModeChange(value)}
          >
            {emoji} {label}
          </Badge>
        ))}
      </div>
    </div>
  );
}