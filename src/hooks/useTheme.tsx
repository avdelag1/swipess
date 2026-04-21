import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

export type Theme = 'dark' | 'light' | 'cheers' | 'nexus-style';

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

const _VALID_THEMES: Theme[] = ['dark', 'light', 'cheers', 'nexus-style'];
const DEFAULT_THEME: Theme = 'dark';
const STORAGE_KEY = 'NEXUS DISCOVERY_theme_preference';

/** Map legacy DB values to new theme names */
function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'dark' || raw === 'black-matte' || raw === 'grey-matte' || raw === 'pure-black') return 'dark';
  if (raw === 'white-matte' || raw === 'light') return 'light';
  if (raw === 'cheers') return 'cheers';
  if (raw === 'nexus-style' || raw === 'cyber' || raw === 'nexus') return 'nexus-style';
  // Default to dark for any removed themes (like ivana)
  return 'dark';
}

const ALL_THEME_CLASSES = [
  'grey-matte', 'black-matte', 'white-matte', 'red-matte',
  'amber-matte', 'pure-black', 'cheers', 'dark', 'light',
  'amber', 'red', 'nexus-style'
];

/** 
 * SPEED OF LIGHT: Optimized DOM theme application 
 * Skips unnecessary removals to prevent flickering in dark mode 
 */
function applyThemeToDOM(theme: Theme) {
  const root = window.document.documentElement;
  
  // Check if theme is already applied - avoids "white flash" caused by class removal
  if (root.classList.contains(theme) && (theme !== 'dark' || root.classList.contains('black-matte'))) {
    return;
  }

  // Mark transition start for smooth color shift
  root.style.colorScheme = (theme === 'cheers' || theme === 'nexus-style') ? 'dark' : theme;
  
  // PERFORMANCE: Only remove if we're actually changing
  root.classList.remove(...ALL_THEME_CLASSES, 'ivanna-style', 'ivana');

  // Add the theme class
  root.classList.add(theme);

  if (theme === 'dark') {
    root.classList.add('black-matte');
  }

  if (theme === 'light') {
    root.classList.add('white-matte');
  }

  if (theme === 'cheers' || theme === 'nexus-style') {
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
  if (theme === 'dark') targetColor = '#000000';
  else if (theme === 'cheers') targetColor = '#180800';
  else if (theme === 'nexus-style') targetColor = '#000000';
  else targetColor = '#ffffff';
  meta.setAttribute('content', targetColor);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SPEED OF LIGHT: Instant initialization from localStorage
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const cached = localStorage.getItem(STORAGE_KEY);
    return normalizeTheme(cached);
  });
  
  const { user, loading } = useAuth();

  // Load theme from database when user is confirmed
  const hasLoadedThemeRef = useRef(false);

  useEffect(() => {
    // PROTECT: Don't flip to light theme while auth is still loading
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
          hasLoadedThemeRef.current = true; // Fix: Prevent theme thrashes on auth refreshes
        } catch (error) {
          logger.error('Failed to load theme preference:', error);
        }
      };
      loadUserTheme();
    } else if (!user && !loading) {
      // Not logged in: fallback to cached theme or default
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) setThemeState(DEFAULT_THEME);
      hasLoadedThemeRef.current = false; // Reset for next user
    }
  }, [user?.id, loading]);

  // Apply theme class to document
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme, coords?: ThemeToggleCoords) => {
    const root = window.document.documentElement;
    
    // UI Feedback: Store coordinates for reveal animation
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
  const isDark = theme === 'dark' || theme === 'cheers' || theme === 'nexus-style';

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

