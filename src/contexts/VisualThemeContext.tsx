import React, { createContext, useContext, useState } from 'react';

interface VisualThemeContextType {
  ambientColor: string;
  setAmbientColor: (color: string) => void;
  resetAmbientColor: () => void;
}

const VisualThemeContext = createContext<VisualThemeContextType | undefined>(undefined);

const DEFAULT_COLOR = '#f97316'; // Swipess Orange

/**
 * 🎨 VISUAL THEME PROVIDER
 * Centralizes the application's ambient presence. This allows any page 
 * (Event Feed, AI Chat, Profiles) to seamlessly shift the app's 
 * global ambient meshes and glows.
 */
export function VisualThemeProvider({ children }: { children: React.ReactNode }) {
  const [ambientColor, setAmbientColor] = useState(DEFAULT_COLOR);

  const resetAmbientColor = () => setAmbientColor(DEFAULT_COLOR);

  return (
    <VisualThemeContext.Provider value={{ ambientColor, setAmbientColor, resetAmbientColor }}>
      {children}
    </VisualThemeContext.Provider>
  );
}

export function useVisualTheme() {
  const context = useContext(VisualThemeContext);
  if (context === undefined) {
    throw new Error('useVisualTheme must be used within a VisualThemeProvider');
  }
  return context;
}


