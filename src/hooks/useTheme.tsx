import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

export type Theme = 'dark' | 'light';

export interface ThemeToggleCoords {
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: Theme, coords?: ThemeToggleCoords) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const _VALID_THEMES: Theme[] = ['dark', 'light'];
const DEFAULT_THEME: Theme = 'dark';
const STORAGE_KEY = 'swipess_theme_preference';

/** Map legacy DB values to new theme names */
function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'light' || raw === 'white-matte') return 'light';
  return 'dark';
}

const ALL_THEME_CLASSES = [
  'dark', 'light', 'pure-black', 'white-matte', 'grey-matte', 'black-matte'
];

/** 
 * SPEED OF LIGHT: Optimized DOM theme application 
 */
function applyThemeToDOM(theme: Theme) {
  const root = window.document.documentElement;
  
  // PERFORMANCE: Only remove if we're actually changing
  root.classList.remove(...ALL_THEME_CLASSES);

  // Add the theme class
  root.classList.add(theme);

  if (theme === 'dark') {
    root.classList.add('black-matte');
    root.style.colorScheme = 'dark';
  } else if (theme === 'light') {
    root.classList.add('white-matte');
    root.style.colorScheme = 'light';
  }

  // Update status bar color for PWA
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  
  let targetColor: string;
  if (theme === 'dark') targetColor = '#000000';
  else targetColor = '#ffffff';
  meta.setAttribute('content', targetColor);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const cached = localStorage.getItem(STORAGE_KEY);
    return normalizeTheme(cached);
  });
  
  const { user, loading } = useAuth();
  const hasLoadedThemeRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (user?.id && !hasLoadedThemeRef.current) {
      const loadUserTheme = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          
          const dbTheme = normalizeTheme(data?.theme_preference);
          if (dbTheme !== theme) {
            setThemeState(dbTheme);
            localStorage.setItem(STORAGE_KEY, dbTheme);
          }
          hasLoadedThemeRef.current = true;
        } catch (error) {
          logger.error('Failed to load theme preference:', error);
        }
      };
      loadUserTheme();
    } else if (!user && !loading) {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) setThemeState(DEFAULT_THEME);
      hasLoadedThemeRef.current = false;
    }
  }, [user?.id, loading]);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme, coords?: ThemeToggleCoords) => {
    const root = window.document.documentElement;
    root.style.setProperty('--theme-reveal-x', coords ? `${coords.x}px` : '50%');
    root.style.setProperty('--theme-reveal-y', coords ? `${coords.y}px` : '50%');

    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(() => {
          applyThemeToDOM(newTheme);
          setThemeState(newTheme);
          localStorage.setItem(STORAGE_KEY, newTheme);
        });
      });
    } else {
      flushSync(() => {
        applyThemeToDOM(newTheme);
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
      });
    }

    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('user_id', user.id);
      } catch (error) {
        logger.error('Failed to save theme preference:', error);
      }
    }
  };

  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  const value = useMemo(() => ({ theme, isLight, isDark, setTheme }), [theme, isLight, isDark]);

  return (
    <ThemeContext.Provider value={value}>
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
