import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'black-matte' | 'white-matte';

const THEME_STORAGE_KEY = 'swipess-theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider - Manages black-matte / white-matte switching.
 *
 * Persistence strategy:
 *  1. Read from localStorage on mount (instant, synchronous, no flash).
 *  2. Write to localStorage on every change.
 *  3. Optionally sync to Supabase profiles table if the column exists.
 *
 * Default: 'white-matte' for new users.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Synchronous read from localStorage — prevents flash of wrong theme
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'black-matte' || stored === 'white-matte') {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return 'black-matte';
  });

  // Apply theme class to document and update status bar color
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all old theme classes
    root.classList.remove('black-matte', 'white-matte', 'dark');

    // Add current theme class
    root.classList.add(theme);

    // Update mobile status bar colour
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

  // Public setter — persists to localStorage immediately
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // localStorage full or unavailable — theme still applies in-memory
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