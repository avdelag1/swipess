import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  SwipeTheme,
} from '@/utils/sounds';
import { setNotificationSoundTheme } from '@/utils/notificationSounds';
import { logger } from '@/utils/prodLogger';

/**
 * Custom hook for managing swipe sound effects
 * Loads user's sound theme preference and provides playback function
 * @returns Object with playSwipeSound function and currentTheme
 */
export function useSwipeSounds() {
  const [theme, setTheme] = useState<SwipeTheme>('none');

  // Load user's sound theme preference
  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('swipe_sound_theme')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          logger.warn('Failed to load swipe sound theme:', error);
          return;
        }

        if (!mounted) return;

        const userTheme = (data?.swipe_sound_theme as SwipeTheme) || 'none';
        setTheme(userTheme);

        // Keep notification sounds in sync with the user's chosen swipe theme
        setNotificationSoundTheme(userTheme);
      } catch (error) {
        logger.warn('Error loading swipe sound theme:', error);
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  // Preloading disabled — in-app swipe sounds are turned off globally.

  /**
   * Play sound effect for swipe direction
   * @param direction - Swipe direction ('left' or 'right')
   */
  // In-app sounds globally disabled — swipe gestures are silent regardless
  // of the user's saved preference. The preference is preserved so the
  // setting can be re-enabled later without data loss.
  const playSwipeSound = (_direction: 'left' | 'right') => {};

  return {
    playSwipeSound,
    currentTheme: theme
  };
}


