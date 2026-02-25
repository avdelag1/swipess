import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'black-matte';

const THEME_STORAGE_KEY = 'swipess-theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider - App permanently locked to black-matte
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('black-matte');

  // Apply theme class to document and update status bar color
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all old theme classes
    root.classList.remove(
      'grey-matte', 'white-matte', 'red-matte', 'amber-matte',
      'pure-black', 'cheers', 'dark', 'amber', 'red'
    );

    // Add current theme class
    root.classList.add('black-matte');

    // Update mobile status bar colour
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.setAttribute('content', '#000000');
  }, []);

  // Dummy setter so nothing crashes
  const setTheme = (newTheme: Theme) => {
    console.log("Theme permanently set to black-matte");
  };

  return (
    <ThemeContext.Provider value={{ theme: 'black-matte', setTheme }}>
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
