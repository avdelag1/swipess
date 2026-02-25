import { motion } from 'framer-motion';
import { Check, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type ThemeId = 'black-matte' | 'white-matte' | 'pure-black' | 'cheers';

interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  icon: string;
  colors: {
    bg: string;
    card: string;
    accent: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    id: 'white-matte',
    name: 'Light',
    description: 'Clean & minimalist',
    icon: '☀️',
    colors: { bg: '#F5F7FA', card: '#FFFFFF', accent: '#C62828' },
  },
  {
    id: 'black-matte',
    name: 'Dark',
    description: 'Deep & elegant',
    icon: '🌙',
    colors: { bg: '#0D0D0D', card: '#1A1A1A', accent: '#E53935' },
  },
  {
    id: 'pure-black',
    name: 'Black',
    description: 'AMOLED void black',
    icon: '⬛',
    colors: { bg: '#000000', card: '#0F0F0F', accent: '#EF5350' },
  },
  {
    id: 'cheers',
    name: 'Cheers',
    description: 'Safari animal print',
    icon: '🐆',
    colors: { bg: '#1A0C03', card: '#261208', accent: '#D4960F' },
  },
];

interface ThemeSelectorProps {
  compact?: boolean;
  showTitle?: boolean;
}

/**
 * ThemeSelector — Minimal light/dark toggle.
 *
 * Two modes:
 *   compact = true  → Small pill for profile headers
 *   compact = false → Wider pill for settings pages
 */
export function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeId) => {
    setTheme(newTheme);
    const themeName = themeOptions.find(t => t.id === newTheme)?.name || newTheme;
    toast.success(`Theme changed to ${themeName}`, {
      description: 'Your preference has been saved',
    });
  };

  /* ── Compact pill (for profile pages) ── */
  if (compact) {
    // Compact: row of small theme swatches
    return (
      <div className="flex items-center gap-2">
        {themeOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleThemeChange(option.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={option.name}
            className="relative w-9 h-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm"
            style={{
              background: option.colors.bg,
              borderColor: theme === option.id ? option.colors.accent : 'transparent',
              boxShadow: theme === option.id ? `0 0 0 2px ${option.colors.accent}55` : undefined,
            }}
          >
            <span style={{ fontSize: '14px' }}>{option.icon}</span>
            {theme === option.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: option.colors.accent }}
              >
                <Check className="w-2 h-2 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  /* ── Full-size pill (for settings) ── */
  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
      {showTitle && (
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Palette className="w-5 h-5 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-6 space-y-5">
        {/* Theme grid */}
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((option) => {
            const isActive = theme === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative rounded-2xl overflow-hidden text-left transition-all duration-200 focus:outline-none"
                style={{
                  border: `2px solid ${isActive ? option.colors.accent : 'transparent'}`,
                  boxShadow: isActive ? `0 0 16px ${option.colors.accent}40` : undefined,
                }}
              >
                {/* Swatch preview */}
                <div
                  className="h-20 flex items-end p-2"
                  style={{ background: option.colors.bg }}
                >
                  {/* Mini card strip */}
                  <div
                    className="w-full h-8 rounded-lg"
                    style={{ background: option.colors.card, opacity: 0.9 }}
                  />
                  {/* Accent dot */}
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full"
                    style={{ background: option.colors.accent }}
                  />
                </div>

                {/* Label row */}
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ background: option.colors.card }}
                >
                  <div>
                    <p className="text-xs font-bold leading-none" style={{ color: option.id === 'white-matte' ? '#1a1a1a' : '#f0f0f0' }}>
                      <span className="mr-1">{option.icon}</span>{option.name}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-none" style={{ color: option.id === 'white-matte' ? '#555' : '#aaa' }}>
                      {option.description}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Badge
                        className="text-[9px] px-1.5 py-0 font-black tracking-wider"
                        style={{ background: option.colors.accent, color: option.id === 'cheers' ? '#1A0C03' : '#fff' }}
                      >
                        <Check className="w-2.5 h-2.5 mr-0.5" />
                        ON
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Theme applies instantly across the app</span>
        </div>
      </div>
    </motion.button>
  );
}
