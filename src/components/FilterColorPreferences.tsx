import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'filter-color-preferences';

const FILTER_CATEGORIES = [
  { id: 'property', label: 'Properties' },
  { id: 'motos', label: 'Motorcycles' },
  { id: 'bikes', label: 'Bicycles' },
  { id: 'jobs', label: 'Jobs' },
];

const DEFAULT_COLORS: Record<string, 'black' | 'white'> = {
  property: 'black',
  motos: 'white',
  bikes: 'black',
  jobs: 'white',
};

const COLOR_OPTIONS = [
  {
    name: 'Black',
    value: 'black' as const,
    // Ring offset + thicker ring ensures the black circle is visible in dark mode
    class: 'bg-black ring-2 ring-foreground/50 ring-offset-2 ring-offset-background',
  },
  {
    name: 'White',
    value: 'white' as const,
    class: 'bg-white border border-border',
  },
];

function useFilterColors() {
  const [colors, setColors] = useState<Record<string, 'black' | 'white'>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_COLORS, ...parsed };
      }
    } catch {
      // localStorage unavailable or invalid JSON
    }
    return DEFAULT_COLORS;
  });

  const setColor = (categoryId: string, color: 'black' | 'white') => {
    const next = { ...colors, [categoryId]: color };
    setColors(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable
    }
  };

  return { colors, setColor };
}

interface FilterColorPreferencesProps {
  compact?: boolean;
}

// Separate component for compact mode
function CompactColorPreferences() {
  const { colors, setColor } = useFilterColors();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Filter Colors</CardTitle>
            <CardDescription className="text-xs">
              Customize category colors
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {FILTER_CATEGORIES.slice(0, 3).map((category) => (
          <div key={category.id} className="space-y-2">
            <Label className="text-sm font-medium">{category.label}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => {
                const isSelected = (colors[category.id] ?? DEFAULT_COLORS[category.id]) === color.value;
                return (
                  <motion.button
                    key={color.value}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setColor(category.id, color.value)}
                    className={`relative w-8 h-8 rounded-full ${color.class} ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                        : 'shadow-md hover:shadow-xl'
                    } transition-all duration-200 group`}
                    title={color.name}
                  >
                    {isSelected && (
                      <svg
                        className={`absolute inset-0 m-auto w-4 h-4 ${color.value === 'white' ? 'text-gray-800' : 'text-white'} drop-shadow-lg`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-2 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Tap a color to customize each category
        </p>
      </CardContent>
    </Card>
  );
}

// Separate component for full mode
function FullColorPreferences() {
  const { colors, setColor } = useFilterColors();

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Filter Color Preferences</CardTitle>
            <CardDescription className="text-sm">
              Customize colors to match your style
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {FILTER_CATEGORIES.map((category, index) => {
          const activeColor = colors[category.id] ?? DEFAULT_COLORS[category.id];
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full shadow-md ${
                  activeColor === 'black'
                    ? 'bg-black ring-2 ring-foreground/50 ring-offset-1 ring-offset-background'
                    : 'bg-white border border-border'
                }`}></div>
                <Label className="text-base font-semibold">{category.label}</Label>
              </div>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((color) => {
                  const isSelected = activeColor === color.value;
                  return (
                    <motion.button
                      key={color.value}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setColor(category.id, color.value)}
                      className={`relative w-12 h-12 rounded-full ${color.class} ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl scale-110'
                          : 'shadow-lg hover:shadow-2xl'
                      } transition-all duration-200 flex items-center justify-center group overflow-visible`}
                      title={color.name}
                    >
                      {isSelected && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className={`w-6 h-6 ${color.value === 'white' ? 'text-gray-800' : 'text-white'} drop-shadow-lg`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                      {/* Hover label */}
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground/90 text-background text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {color.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs">💡</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These colors will be used throughout the app to help you quickly identify different categories of listings. Choose colors that are visually distinct and meaningful to you.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component that switches between compact and full modes
export function FilterColorPreferences({ compact = false }: FilterColorPreferencesProps) {
  return compact ? <CompactColorPreferences /> : <FullColorPreferences />;
}

// Export hook for other components that need to read the stored color preferences
export { useFilterColors };
