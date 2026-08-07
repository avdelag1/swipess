import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ThemeContext } from '@/hooks/useAppTheme';
import { useContext } from 'react';

/**
 * 🛡️ THEME SYNC MANAGER
 * Decouples Auth from the core ThemeProvider to break circular dependencies.
 * Handles loading the theme from the database and saving changes.
 * Network / CORS / Safari "Load failed" never blocks the app — localStorage is source of truth offline.
 */
export function ThemeSyncManager() {
  const { user, loading } = useAuth();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const setTheme = themeContext?.setTheme ?? (() => {});
  const hasLoadedThemeRef = useRef(false);
  const STORAGE_KEY = 'swipess_theme_preference';

  // LOAD from DB (best-effort)
  useEffect(() => {
    if (loading || !user?.id || hasLoadedThemeRef.current) return;

    const loadUserTheme = async () => {
      // Prefer cached local preference immediately so UI never flashes wrong theme
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local && local !== theme) {
          setTheme(local as never);
        }
      } catch { /* private mode */ }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('user_id', user.id)
          .maybeSingle();

        // Network / CORS / offline — keep local theme, no console error spam
        if (error) {
          hasLoadedThemeRef.current = true;
          return;
        }

        if (data?.theme_preference && data.theme_preference !== theme) {
          setTheme(data.theme_preference as never);
          try {
            localStorage.setItem(STORAGE_KEY, data.theme_preference);
          } catch { /* empty */ }
        }
        hasLoadedThemeRef.current = true;
      } catch {
        // Safari "Load failed" / TypeError — silent; local theme is fine
        hasLoadedThemeRef.current = true;
      }
    };

    void loadUserTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading, theme]);

  // SAVE to DB when theme changes (best-effort)
  const lastSavedThemeRef = useRef(theme);
  useEffect(() => {
    if (!user?.id || theme === lastSavedThemeRef.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, String(theme));
    } catch { /* empty */ }

    const saveTheme = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: theme })
          .eq('user_id', user.id);
        if (error) return;
        lastSavedThemeRef.current = theme;
      } catch {
        // offline / CORS — localStorage already updated
      }
    };

    void saveTheme();
  }, [theme, user?.id]);

  return null;
}
