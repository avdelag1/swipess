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

          const validThemes = ['black-matte', 'white-matte'];
          if (data?.theme_preference && validThemes.includes(data.theme_preference)) {
            setThemeState(data.theme_preference as Theme);
          }
        } catch (error) {
          logger.error('Failed to load theme preference:', error);
          setThemeState('black-matte');
        }
      };
      loadUserTheme();
    } else {
      setThemeState('black-matte');
    }
  }, [user?.id]);

  // Apply theme class to document and update status bar
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes safely
    root.classList.remove('grey-matte', 'black-matte', 'white-matte', 'red-matte', 'amber-matte', 'pure-black', 'cheers', 'dark', 'amber', 'red');

    // Add current theme class + 'dark' variant ONLY for dark-based themes
    if (theme === 'white-matte') {
      root.classList.add(theme);
    } else {
      root.classList.add(theme, 'dark');
    }

    // Update status bar base color according to theme
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    if (theme === 'white-matte') {
      metaThemeColor.setAttribute('content', '#ffffff');
    } else {
      metaThemeColor.setAttribute('content', '#000000');
    }
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
