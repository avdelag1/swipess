import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

type Theme = 'dark' | 'light';

export interface ThemeToggleCoords {
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, coords?: ThemeToggleCoords) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES: Theme[] = ['dark', 'light'];
const DEFAULT_THEME: Theme = 'dark';

/** Map legacy DB values to new theme names */
function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'dark' || raw === 'black-matte' || raw === 'grey-matte' || raw === 'pure-black') return 'dark';
  return 'light';
}

const ALL_THEME_CLASSES = [
  'grey-matte', 'black-matte', 'white-matte', 'red-matte',
  'amber-matte', 'pure-black', 'cheers', 'dark', 'light',
  'amber', 'red',
];

function applyThemeToDOM(theme: Theme) {
  const root = window.document.documentElement;
  
  // Mark transition start for smooth color shift
  root.style.colorScheme = theme;
  
  // Remove all old theme classes
  root.classList.remove(...ALL_THEME_CLASSES);

  // Add the theme class — .dark or .light
  root.classList.add(theme);

  // For dark theme, also add .black-matte so CSS variables are applied
  if (theme === 'dark') {
    root.classList.add('black-matte');
  }

  // Update status bar color for PWA (respects safe-area)
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  
  // Smooth transition for status bar in PWA
  const targetColor = theme === 'dark' ? '#000000' : '#ffffff';
  meta.setAttribute('content', targetColor);
  
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const { user } = useAuth();

  // Load theme from database when user logs in
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
          setThemeState(normalizeTheme(data?.theme_preference));
        } catch (error) {
          logger.error('Failed to load theme preference:', error);
          setThemeState(DEFAULT_THEME);
        }
      };
      loadUserTheme();
    } else {
      setThemeState(DEFAULT_THEME);
    }
  }, [user?.id]);

  // Apply theme class to document
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Save theme to database and update state
  const setTheme = async (newTheme: Theme, coords?: ThemeToggleCoords) => {
    const root = window.document.documentElement;

    // Store click origin for the CSS clip-path reveal animation
    if (coords) {
      root.style.setProperty('--theme-reveal-x', `${coords.x}px`);
      root.style.setProperty('--theme-reveal-y', `${coords.y}px`);
    } else {
      root.style.setProperty('--theme-reveal-x', '50%');
      root.style.setProperty('--theme-reveal-y', '50%');
    }

    // Use View Transitions API for circular ripple reveal if supported
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        applyThemeToDOM(newTheme);
        setThemeState(newTheme);
      });
    } else {
      // Fallback: apply immediately (CSS transition handles the rest)
      applyThemeToDOM(newTheme);
      setThemeState(newTheme);
    }

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
