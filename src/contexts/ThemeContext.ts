import React from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'dark' | 'light' | 'cheers' | 'red-matte' | 'amber-matte' | 'pure-black' | 'Zenith-style';

export interface ThemeToggleCoords {
  x: number;
  y: number;
}

export interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: Theme, coords?: ThemeToggleCoords) => void;
}

export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function useAppTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    if (import.meta.env.DEV) console.warn('[Theme] useAppTheme called outside ThemeProvider. Using fallback.');
    return {
      theme: 'dark',
      isLight: false,
      isDark: true,
      setTheme: () => {}
    };
  }
  return context;
}

const DEFAULT_THEME: Theme = 'dark';
const STORAGE_KEY = 'zenith_theme_preference';

function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'light' || raw === 'white-matte') return 'light';
  if (raw === 'cheers') return 'cheers';
  if (raw === 'red-matte' || raw === 'red') return 'red-matte';
  if (raw === 'amber-matte' || raw === 'amber') return 'amber-matte';
  if (raw === 'pure-black') return 'pure-black';
  if (raw === 'Zenith-style' || raw === 'cyber' || raw === 'Zenith') return 'Zenith-style';
  if (raw === 'dark' || raw === 'black-matte' || raw === 'grey-matte') return 'dark';
  return 'dark';
}

const ALL_THEME_CLASSES = [
  'grey-matte', 'black-matte', 'white-matte', 'red-matte',
  'amber-matte', 'pure-black', 'cheers', 'dark', 'light',
  'amber', 'red', 'Zenith-style'
];

function applyThemeToDOM(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  if (root.classList.contains(theme) && (theme !== 'dark' || root.classList.contains('black-matte'))) return;
  root.style.colorScheme = (theme === 'light') ? 'light' : 'dark';
  root.classList.remove(...ALL_THEME_CLASSES, 'ivanna-style', 'ivana');
  root.classList.add(theme);
  if (theme === 'dark') root.classList.add('black-matte');
  else if (theme === 'light') root.classList.add('white-matte');
  else root.classList.add('dark');

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  let targetColor: string;
  if (theme === 'dark' || theme === 'pure-black' || theme === 'Zenith-style') targetColor = '#000000';
  else if (theme === 'cheers') targetColor = '#180800';
  else if (theme === 'red-matte') targetColor = '#2d0a0a';
  else if (theme === 'amber-matte') targetColor = '#1a1200';
  else targetColor = '#ffffff';
  meta.setAttribute('content', targetColor);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const cached = localStorage.getItem(STORAGE_KEY);
    return normalizeTheme(cached);
  });

  React.useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme, coords?: ThemeToggleCoords) => {
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
  }, []);

  const isLight = theme === 'light';
  const isDark = !isLight;
  const value = React.useMemo(() => ({ theme, isLight, isDark, setTheme }), [theme, isLight, isDark, setTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}
