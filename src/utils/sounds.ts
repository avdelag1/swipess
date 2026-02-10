/**
 * Sound management utility for swipe interactions
 * Provides customizable sound themes for left/right swipes
 */

export type SwipeTheme = 'none' | 'book' | 'water' | 'funny' | 'calm' | 'randomZen';

/**
 * Sound file mappings for each theme
 * Each theme has left and right swipe sounds
 * RandomZen randomly selects from a pool of zen sounds
 */
export const soundMap = {
  none: {
    left: null as null | string,
    right: null as null | string
  },

  book: {
    left: '/sounds/book-closing-466850.mp3',
    right: '/sounds/page-turned-84574.mp3'
  },

  water: {
    left: '/sounds/water-splash-46402.mp3',
    right: '/sounds/water-droplet-sfx-417690.mp3'
  },

  funny: {
    left: '/sounds/funny-short-comedy-fart-sound-effect-318912.mp3',
    right: '/sounds/ding-sfx-472366.mp3'
  },

  calm: {
    left: '/sounds/deep-meditation-bell-hit-third-eye-chakra-6-186972.mp3',
    right: '/sounds/deep-meditation-bell-hit-heart-chakra-4-186970.mp3'
  },

  randomZen: {
    sounds: [
      '/sounds/bells-2-31725.mp3',
      '/sounds/bell-a-99888.mp3',
      '/sounds/deep-meditation-bell-hit-heart-chakra-4-186970.mp3',
      '/sounds/deep-meditation-bell-hit-third-eye-chakra-6-186972.mp3',
      '/sounds/large-gong-2-232438.mp3'
    ]
  }
};

/**
 * Theme display names for UI
 */
export const themeDisplayNames: Record<SwipeTheme, string> = {
  none: 'None',
  book: 'Book Pages',
  water: 'Water Drop',
  funny: 'Funny',
  calm: 'Calm Bells',
  randomZen: 'Random Zen'
};

/**
 * Play a random zen sound from the pool
 * @param volume - Volume level (0.0 to 1.0), default 0.45
 */
export function playRandomZen(volume = 0.45): void {
  const arr = soundMap.randomZen.sounds;
  if (!arr || arr.length === 0) return;

  const randomSound = arr[Math.floor(Math.random() * arr.length)];
  const audio = new Audio(randomSound);
  audio.volume = volume;
  audio.play().catch((error) => {
    console.warn('Random zen sound playback failed:', error);
  });
}

/**
 * Create and preload an Audio element
 * @param src - Sound file path (null returns null)
 * @param volume - Volume level (0.0 to 1.0), default 0.5
 * @returns HTMLAudioElement or null if src is null
 */
export function createAudio(src: string | null, volume = 0.5): HTMLAudioElement | null {
  if (!src) return null;

  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = volume;

  try {
    audio.load();
  } catch (error) {
    console.warn('Failed to preload audio:', src, error);
  }

  return audio;
}

/**
 * Play a sound with error handling
 * Resets audio to start before playing for rapid replay support
 * @param audio - HTMLAudioElement to play
 */
export function playSound(audio: HTMLAudioElement | null): void {
  if (!audio) return;

  try {
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn('Sound playback failed:', error);
    });
  } catch (error) {
    console.warn('Sound playback error:', error);
  }
}

/**
 * Get sound file path for a specific theme and direction
 * @param theme - The swipe theme
 * @param direction - Swipe direction ('left' or 'right')
 * @returns Sound file path or null
 */
export function getSoundForTheme(
  theme: SwipeTheme,
  direction: 'left' | 'right'
): string | null {
  if (theme === 'none' || theme === 'randomZen') {
    return null;
  }

  const themeMap = soundMap[theme] as { left: string; right: string };
  return themeMap[direction];
}
