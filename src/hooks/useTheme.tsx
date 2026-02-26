import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'grey-matte' | 'black-matte' | 'white-matte' | 'red-matte' | 'pure-black' | 'cheers' | 'amber-matte';

const THEME_STORAGE_KEY = 'swipess-theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'white-matte'
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(
      'grey-matte', 'white-matte', 'red-matte', 'amber-matte',
      'pure-black', 'cheers', 'dark', 'amber', 'red'
    );

    root.classList.add(theme);

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    // Set status bar roughly matching background
    if (theme === 'white-matte') {
      metaThemeColor.setAttribute('content', '#f9fafb');
    } else {
      metaThemeColor.setAttribute('content', '#000000');
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
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
