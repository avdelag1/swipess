import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  SwipeTheme,
  createAudio,
  playSound,
  playRandomZen,
  getSoundForTheme
} from '@/utils/sounds';

/**
 * Custom hook for managing swipe sound effects
 * Loads user's sound theme preference and provides playback function
 * @returns Object with playSwipeSound function
 */
export function useSwipeSounds() {
  const [theme, setTheme] = useState<SwipeTheme>('none');
  const leftAudioRef = useRef<HTMLAudioElement | null>(null);
  const rightAudioRef = useRef<HTMLAudioElement | null>(null);

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
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Failed to load swipe sound theme:', error);
          return;
        }

        if (!mounted) return;

        const userTheme = (data?.swipe_sound_theme as SwipeTheme) || 'none';
        setTheme(userTheme);
      } catch (error) {
        console.warn('Error loading swipe sound theme:', error);
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  // Preload audio files when theme changes
  useEffect(() => {
    // Clean up previous audio elements
    leftAudioRef.current = null;
    rightAudioRef.current = null;

    // Don't preload for 'none' or 'randomZen' themes
    if (theme === 'none' || theme === 'randomZen') {
      return;
    }

    // Create and preload audio elements for the current theme
    const leftSrc = getSoundForTheme(theme, 'left');
    const rightSrc = getSoundForTheme(theme, 'right');

    leftAudioRef.current = createAudio(leftSrc, 0.5);
    rightAudioRef.current = createAudio(rightSrc, 0.5);
  }, [theme]);

  /**
   * Play sound effect for swipe direction
   * @param direction - Swipe direction ('left' or 'right')
   */
  const playSwipeSound = (direction: 'left' | 'right') => {
    try {
      if (theme === 'none') {
        return;
      }

      if (theme === 'randomZen') {
        playRandomZen(0.45);
        return;
      }

      // Play the appropriate sound based on direction
      if (direction === 'left') {
        playSound(leftAudioRef.current);
      } else {
        playSound(rightAudioRef.current);
      }
    } catch (error) {
      console.warn('Error playing swipe sound:', error);
    }
  };

  return {
    playSwipeSound,
    currentTheme: theme
  };
}
