import React from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, Sparkles, Eye } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Dark Matte',
    description: 'Deep AMOLED black',
    icon: '🌙',
    colors: {
      primary: '#000000',
      secondary: '#0a0a0a',
      accent: '#eb1e4b'
    }
  },
  {
    id: 'light',
    name: 'White Matte',
    description: 'Clean & minimalist',
    icon: '☀️',
    colors: {
      primary: '#ffffff',
      secondary: '#f8f8f8',
      accent: '#3b82f6'
    }
  },
  {
    id: 'ivanna-style',
    name: 'Ivana Sky',
    description: 'Painterly sunset sky',
    icon: '🌅',
    colors: {
      primary: '#bbd4e8',
      secondary: '#f3e8d8',
      accent: '#6fa8dc'
    }
  },
  {
    id: 'cheers',
    name: 'Cheers',
    description: 'Animal print & gold',
    icon: '🐆',
    colors: {
      primary: '#180800',
      secondary: '#362111',
      accent: '#d4af37'
    }
  },
  {
    id: 'nexus-style',
    name: 'Nexus HUD',
    description: 'Futuristic glass UI',
    icon: '🛸',
    colors: {
      primary: '#000000',
      secondary: '#111111',
      accent: '#00d2ff'
    }
  }
];

interface ThemeSelectorProps {
  compact?: boolean;
  showTitle?: boolean;
}

export function ThemeSelector({ compact = false, showTitle = true }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const themeName = themeOptions.find(t => t.id === newTheme)?.name || newTheme;
    toast.success(`Theme changed to ${themeName}`, {
      description: "Your preference has been saved"
    });
  };

  if (compact) {
    return (
      <div className="flex gap-2 p-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-x-auto no-scrollbar">
        {themeOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleThemeChange(option.id)}
            className={`
              relative flex-shrink-0 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200
              ${theme === option.id
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }
            `}
            whileHover={{ scale: theme === option.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.95 }}
            title={option.description}
          >
            <span className="mr-1.5">{option.icon}</span>
            <span className="hidden sm:inline">{option.name.split(' ')[0]}</span>
            {theme === option.id && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-1 -right-1"
              >
                <div className="w-2 h-2 bg-primary rounded-full border-2 border-background" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

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
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themeOptions.map((option) => (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <button
                onClick={() => handleThemeChange(option.id)}
                className={`
                  w-full p-5 rounded-xl border-2 transition-all duration-300 text-left
                  relative overflow-hidden group
                  ${theme === option.id
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                    : 'border-border hover:border-primary/50 hover:shadow-md bg-card/50'
                  }
                `}
              >
                {/* Background gradient effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${option.colors.primary}05, ${option.colors.accent}05)`
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Color Preview */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex gap-1.5">
                      {Object.values(option.colors).map((color, index) => (
                        <motion.div
                          key={`color-${color}-${index}`}
                          className="w-5 h-5 rounded-full border-2 border-border/50 shadow-sm"
                          style={{ backgroundColor: color }}
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        />
                      ))}
                    </div>
                    {theme === option.id && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="ml-auto"
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <Badge className="bg-primary text-primary-foreground shadow-sm">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div>
                    <h3 className="font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <span className="text-xl">{option.icon}</span>
                      {option.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Selection indicator */}
                {theme === option.id && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Live Preview Section */}
        <div className="pt-4 border-t border-border/50">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </h4>
            <div
              className="rounded-lg p-4 border transition-all duration-300"
              style={{
                backgroundColor: themeOptions.find(t => t.id === theme)?.colors.primary,
                borderColor: themeOptions.find(t => t.id === theme)?.colors.accent,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: themeOptions.find(t => t.id === theme)?.colors.accent }}
                  />
                  <div>
                    <div
                      className="h-3 w-20 rounded"
                      style={{ backgroundColor: themeOptions.find(t => t.id === theme)?.colors.secondary }}
                    />
                    <div
                      className="h-2 w-14 rounded mt-1 opacity-60"
                      style={{ backgroundColor: themeOptions.find(t => t.id === theme)?.colors.secondary }}
                    />
                  </div>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: themeOptions.find(t => t.id === theme)?.colors.accent }}
                >
                  Active
                </div>
              </div>
              <div className="flex gap-2">
                <div
                  className="flex-1 h-2 rounded"
                  style={{ backgroundColor: themeOptions.find(t => t.id === theme)?.colors.secondary }}
                />
                <div
                  className="w-8 h-2 rounded"
                  style={{ backgroundColor: themeOptions.find(t => t.id === theme)?.colors.accent }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <p>
              Theme changes apply instantly across the entire app
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}