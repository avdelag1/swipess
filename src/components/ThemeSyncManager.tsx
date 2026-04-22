import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { logger } from '@/utils/prodLogger';

/**
 * 🛡️ THEME SYNC MANAGER
 * Decouples Auth from the core ThemeProvider to break circular dependencies.
 * Handles loading the theme from the database and saving changes.
 */
export function ThemeSyncManager() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useAppTheme();
  const hasLoadedThemeRef = useRef(false);
  const STORAGE_KEY = 'Swipess_theme_preference';

  // LOAD from DB
  useEffect(() => {
    if (loading || !user?.id || hasLoadedThemeRef.current) return;

    const loadUserTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.theme_preference && data.theme_preference !== theme) {
          // Update local state without triggering a DB save loop
          // (setTheme in useAppTheme should be pure for local state)
          setTheme(data.theme_preference as any);
          localStorage.setItem(STORAGE_KEY, data.theme_preference);
        }
        hasLoadedThemeRef.current = true;
      } catch (error) {
        logger.error('[ThemeSync] Failed to load preference:', error);
      }
    };
    
    loadUserTheme();
  }, [user?.id, loading, theme, setTheme]);

  // SAVE to DB when theme changes
  const lastSavedThemeRef = useRef(theme);
  useEffect(() => {
    if (!user?.id || theme === lastSavedThemeRef.current) return;

    const saveTheme = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: theme })
          .eq('user_id', user.id);
        lastSavedThemeRef.current = theme;
      } catch (error) {
        logger.error('[ThemeSync] Failed to save preference:', error);
      }
    };

    saveTheme();
  }, [theme, user?.id]);

  return null;
}
