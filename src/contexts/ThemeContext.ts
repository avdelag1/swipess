import React from 'react';
import { flushSync } from 'react-dom';
import { Capacitor } from '@capacitor/core';

export type Theme = 'dark' | 'light' | 'cheers' | 'red-matte' | 'amber-matte' | 'pure-black' | 'Swipess-style';

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
const STORAGE_KEY = 'swipess_theme_preference';

function normalizeTheme(raw: string | null | undefined): Theme {
  // App surface themes: only light + dark. Legacy values map into dark.
  if (raw === 'light' || raw === 'white-matte') return 'light';
  if (
    raw === 'dark' ||
    raw === 'black-matte' ||
    raw === 'grey-matte' ||
    raw === 'cheers' ||
    raw === 'red-matte' ||
    raw === 'red' ||
    raw === 'amber-matte' ||
    raw === 'amber' ||
    raw === 'pure-black' ||
    raw === 'Swipess-style' ||
    raw === 'cyber' ||
    raw === 'Swipess'
  ) return 'dark';
  return 'dark';
}

const ALL_THEME_CLASSES = [
  'grey-matte', 'black-matte', 'white-matte', 'red-matte',
  'amber-matte', 'pure-black', 'cheers', 'dark', 'light',
  'amber', 'red', 'Swipess-style'
];

function applyThemeToDOM(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  const isLightTheme = theme === 'light' || theme === 'white-matte';
  root.style.colorScheme = isLightTheme ? 'light' : 'dark';
  root.classList.remove(...ALL_THEME_CLASSES, 'ivanna-style', 'ivana');
  root.classList.add(theme);
  
  if (theme === 'dark' || theme === 'black-matte') root.classList.add('black-matte', 'dark');
  else if (isLightTheme) root.classList.add('white-matte', 'light');
  else root.classList.add('dark');

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  let targetColor: string;
  if (theme === 'light') targetColor = '#F2F2F7';
  else targetColor = '#0a0a0d';
  meta.setAttribute('content', targetColor);

  // Native: match the status bar to the active theme — dark text on the light
  // theme, light text on every dark theme — and tint its background (Android)
  // so the bar blends into the screen instead of a fixed black strip.
  if (Capacitor.isNativePlatform()) {
    const isLightTheme = theme === 'light';
    void import('@/utils/microPolish').then(({ setStatusBarColor }) => {
      void setStatusBarColor(isLightTheme ? 'light' : 'dark', targetColor);
    });
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const cached = localStorage.getItem(STORAGE_KEY);
    return normalizeTheme(cached);
  });

  // useLayoutEffect ensures theme classes are applied BEFORE paint,
  // preventing a flash of the wrong theme on page reload.
  React.useLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme, coords?: ThemeToggleCoords) => {
    // Only Dark + Light are active surface themes; legacy ids coerce in.
    const next = normalizeTheme(newTheme);
    const root = window.document.documentElement;
    root.style.setProperty('--theme-reveal-x', coords ? `${coords.x}px` : '50%');
    root.style.setProperty('--theme-reveal-y', coords ? `${coords.y}px` : '50%');
    const doc = document as any;
    if (doc.startViewTransition) {
      const html = document.documentElement;
      html.setAttribute('data-theme-transition', '');
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyThemeToDOM(next);
          setThemeState(next);
          localStorage.setItem(STORAGE_KEY, next);
        });
      });
      transition.finished.finally(() => html.removeAttribute('data-theme-transition'));
    } else {
      flushSync(() => {
        applyThemeToDOM(next);
        setThemeState(next);
        localStorage.setItem(STORAGE_KEY, next);
      });
    }
  }, []);

  const isLight = theme === 'light' || theme === 'white-matte';
  const isDark = !isLight;
  const value = React.useMemo(() => ({ theme, isLight, isDark, setTheme }), [theme, isLight, isDark, setTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}
