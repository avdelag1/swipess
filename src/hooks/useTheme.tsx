// @ts-nocheck
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

// WE ARE FORCING BLACK-MATTE EVERYWHERE TO FIX THE LIGHT BACKGROUND BUG
type Theme = 'black-matte';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always force black-matte
  const [theme, setThemeState] = useState<Theme>('black-matte');
  const { user } = useAuth();

  // Load theme from database but we're forcing black-matte 
  useEffect(() => {
    setThemeState('black-matte');
  }, [user?.id]);

  // Apply theme class to document and update status bar
  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all old theme classes
    root.classList.remove('grey-matte', 'white-matte', 'red-matte', 'amber-matte', 'amber', 'red');

    // FORCE black-matte and Tailwind's dark class
    root.classList.add('black-matte', 'dark');

    // Update status bar color to black
    const color = '#000000';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', color);
  }, [theme]);

  // Prevent actually setting white themes
  const setTheme = async (newTheme: string) => {
    setThemeState('black-matte');

    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: 'black-matte' })
          .eq('id', user.id);
      } catch (error) {
        logger.error('Failed to save theme preference:', error);
      }
    }
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
