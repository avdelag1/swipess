import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

export type Theme = 'dark' | 'light' | 'cheers' | 'red-matte' | 'amber-matte' | 'pure-black' | 'Swipess-style';

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

/**
 * 🛡️ SAFE THEME HOOK
 * Prevents production crashes if called before the provider is ready.
 * Returns a default 'dark' context and logs a warning in dev.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // If we're here, it means useTheme was called outside of ThemeProvider
    // or during a race condition in the production bundle.
    // Return a safe fallback to prevent the entire app from crashing.
    if (import.meta.env.DEV) {
      console.warn('[Theme] useTheme called outside ThemeProvider. Using fallback.');
    }
    return {
      theme: 'dark',
      isLight: false,
      isDark: true,
      setTheme: () => {
        if (import.meta.env.DEV) console.warn('[Theme] setTheme called on fallback context.');
      }
    };
  }
  return context;
}

const _VALID_THEMES: Theme[] = ['dark', 'light', 'cheers', 'red-matte', 'amber-matte', 'pure-black', 'Swipess-style'];
const DEFAULT_THEME: Theme = 'dark';
const STORAGE_KEY = 'Swipess_theme_preference';

/** Map legacy DB values to new theme names */
function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'light' || raw === 'white-matte') return 'light';
  if (raw === 'cheers') return 'cheers';
  if (raw === 'red-matte' || raw === 'red') return 'red-matte';
  if (raw === 'amber-matte' || raw === 'amber') return 'amber-matte';
  if (raw === 'pure-black') return 'pure-black';
  if (raw === 'Swipess-style' || raw === 'cyber' || raw === 'Swipess') return 'Swipess-style';
  if (raw === 'dark' || raw === 'black-matte' || raw === 'grey-matte') return 'dark';
  return 'dark';
}

const ALL_THEME_CLASSES = [
  'grey-matte', 'black-matte', 'white-matte', 'red-matte',
  'amber-matte', 'pure-black', 'cheers', 'dark', 'light',
  'amber', 'red', 'Swipess-style'
];

/** 
 * SPEED OF LIGHT: Optimized DOM theme application 
 */
function applyThemeToDOM(theme: Theme) {
  const root = window.document.documentElement;
  
  // Check if theme is already applied - avoids "white flash" caused by class removal
  if (root.classList.contains(theme) && (theme !== 'dark' || root.classList.contains('black-matte'))) {
    return;
  }

  // Mark transition start for smooth color shift
  root.style.colorScheme = (theme === 'light') ? 'light' : 'dark';
  
  // PERFORMANCE: Only remove if we're actually changing
  root.classList.remove(...ALL_THEME_CLASSES, 'ivanna-style', 'ivana');

  // Add the theme class
  root.classList.add(theme);

  if (theme === 'dark') {
    root.classList.add('black-matte');
  } else if (theme === 'light') {
    root.classList.add('white-matte');
  } else if (theme !== 'light') {
    root.classList.add('dark');
  }

  // Update status bar color for PWA (respects safe-area)
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  
  let targetColor: string;
  if (theme === 'dark' || theme === 'pure-black' || theme === 'Swipess-style') targetColor = '#000000';
  else if (theme === 'cheers') targetColor = '#180800';
  else if (theme === 'red-matte') targetColor = '#2d0a0a';
  else if (theme === 'amber-matte') targetColor = '#1a1200';
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
  }, [user?.id, loading, theme]);

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
  const isDark = !isLight;

  const value = useMemo(() => ({ theme, isLight, isDark, setTheme }), [theme, isLight, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

