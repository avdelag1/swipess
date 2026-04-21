import { Bike, Home, Briefcase, Key, Tag } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { motion } from 'framer-motion';
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

const springTap = { type: "spring" as const, stiffness: 500, damping: 30 };

const categoryStyles: Record<Category, { active: string; glow: string }> = {
  property: {
    active: 'bg-gradient-to-r from-rose-600 to-rose-500 text-white border-rose-500/50 shadow-lg shadow-emerald-500/25',
    glow: 'hover:border-rose-500/40',
  },
  motorcycle: {
    active: 'bg-gradient-to-r from-orange-600 to-orange-500 text-white border-orange-500/50 shadow-lg shadow-orange-500/25',
    glow: 'hover:border-orange-500/40',
  },
  bicycle: {
    active: 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-500/50 shadow-lg shadow-purple-500/25',
    glow: 'hover:border-purple-500/40',
  },
  worker: {
    active: 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-500/50 shadow-lg shadow-amber-500/25',
    glow: 'hover:border-amber-500/40',
  },
};

export function CategorySelector({
  selectedCategory,
  selectedMode,
  onCategoryChange,
  onModeChange,
  className = ''
}: CategorySelectorProps) {
  const categories = [
    { value: 'property' as Category, label: 'Properties', icon: Home },
    { value: 'motorcycle' as Category, label: 'Motorcycles', icon: MotorcycleIcon },
    { value: 'bicycle' as Category, label: 'Bicycles', icon: Bike },
    { value: 'worker' as Category, label: 'Workers', icon: Briefcase },
  ];

  const modes = [
    { value: 'rent' as Mode, label: 'For Rent', icon: Key },
    { value: 'sale' as Mode, label: 'For Sale', icon: Tag },
  ];

  const handleModeToggle = (clicked: 'rent' | 'sale') => {
    if (selectedMode === 'both') {
      onModeChange(clicked === 'rent' ? 'sale' : 'rent');
    } else if (selectedMode === clicked) {
      return;
    } else {
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
          const styles = categoryStyles[value];
          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => onCategoryChange(value)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              transition={springTap}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border",
                active
                  ? styles.active
                  : cn('bg-white/[0.04] text-muted-foreground border-white/[0.08]', styles.glow, 'hover:text-foreground hover:bg-white/[0.07]')
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {modes.map(({ value, label, icon: ModeIcon }) => {
          const active = isModeActive(value as 'rent' | 'sale');
          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => handleModeToggle(value as 'rent' | 'sale')}
              whileTap={{ scale: 0.96 }}
              transition={springTap}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border cursor-pointer",
                active
                  ? 'bg-primary text-primary-foreground border-primary/50'
                  : 'bg-card text-muted-foreground border-border/60 hover:border-border hover:text-foreground'
              )}
            >
              <ModeIcon className="w-4 h-4" />
              {label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}


