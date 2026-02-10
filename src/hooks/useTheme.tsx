import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';
type Theme = 'black-matte' | 'white-matte';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('black-matte');
  const { user } = useAuth();

  // Load theme from database when user logs in
  useEffect(() => {
    if (user?.id) {
      const loadUserTheme = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('id', user.id)
            .maybeSingle();

          if (error) throw error;

          // Support both old and new theme names for backwards compatibility
          const validThemes = ['black-matte', 'white-matte'];
          const legacyThemeMap: Record<string, Theme> = {
            'default': 'black-matte',
            'dark': 'black-matte',
            'grey-matte': 'black-matte',
            'amber': 'black-matte',
            'amber-matte': 'black-matte',
            'red': 'black-matte',
            'red-matte': 'black-matte'
          };

          if (data?.theme_preference) {
            const preferredTheme = data.theme_preference;
            if (validThemes.includes(preferredTheme)) {
              setThemeState(preferredTheme as Theme);
            } else if (legacyThemeMap[preferredTheme]) {
              setThemeState(legacyThemeMap[preferredTheme]);
            }
          }
        } catch (error) {
          logger.error('Failed to load theme preference:', error);
          setThemeState('black-matte');
        }
      };
      loadUserTheme();
    } else {
      // Reset to black-matte when logged out
      setThemeState('black-matte');
    }
  }, [user?.id]);

  // Apply theme class to document and update status bar
  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all theme classes
    root.classList.remove('grey-matte', 'black-matte', 'white-matte', 'red-matte', 'amber-matte', 'dark', 'amber', 'red');

    // Add current theme class
    root.classList.add(theme);

    // Update status bar color based on theme
    const themeColors: Record<string, string> = {
      'black-matte': '#000000',
      'white-matte': '#f5f5f5',
    };

    const color = themeColors[theme] || '#1a1a1a';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', color);
  }, [theme]);

  // Save theme to database and update state
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);

        if (error) throw error;
      } catch (error) {
        logger.error('Failed to save theme preference:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}