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

const THEME_STORAGE_KEY = 'swipess-theme';
const VALID_THEMES: Theme[] = ['black-matte', 'white-matte'];

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && VALID_THEMES.includes(saved as Theme)) return saved as Theme;
  } catch { /* ignore */ }
  return 'black-matte';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme);
  const { user } = useAuth();

  // Load theme from database when user logs in (DB takes priority over localStorage)
  useEffect(() => {
    if (user?.id) {
      const loadUserTheme = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;

          if (data?.theme_preference && VALID_THEMES.includes(data.theme_preference as Theme)) {
            const dbTheme = data.theme_preference as Theme;
            setThemeState(dbTheme);
            try { localStorage.setItem(THEME_STORAGE_KEY, dbTheme); } catch { /* ignore */ }
          }
        } catch (error) {
          logger.error('Failed to load theme preference:', error);
        }
      };
      loadUserTheme();
    }
  }, [user?.id]);

  // Apply theme class to document and update status bar
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes safely
    root.classList.remove('grey-matte', 'black-matte', 'white-matte', 'red-matte', 'amber-matte', 'pure-black', 'cheers', 'dark', 'amber', 'red');

    // Add current theme class
    root.classList.add(theme);
    
    // Only add 'dark' class for dark themes
    if (theme !== 'white-matte') {
      root.classList.add('dark');
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

  // Save theme to localStorage + database and update state
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try { localStorage.setItem(THEME_STORAGE_KEY, newTheme); } catch { /* ignore */ }

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('user_id', user.id);

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
