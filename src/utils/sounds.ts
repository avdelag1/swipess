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

  /**
   * Funny theme uses random pools for both directions:
   * - left (dislike): always a fart — picks randomly from funnyDislikePool
   * - right (like): picks randomly from funnyLikePool
   * These are handled in useSwipeSounds via playFunnyDislike / playFunnyLike
   */
  funny: {
    left: null as null | string,   // handled via funnyDislikePool
    right: null as null | string   // handled via funnyLikePool
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
 * Pool of fart/funny dislike sounds for the funny theme (left swipe = dislike).
 * All entries are fart or funny fail sounds — always a bother when you dislike!
 */
export const funnyDislikePool: string[] = [
  '/sounds/funny-short-comedy-fart-sound-effect-318912.mp3', // classic fart
  '/sounds/whistle-slide-down-dislike.mp3',                  // slide whistle fail
  '/sounds/funny-cartoon-drum-dislike.mp3',                  // cartoon drum stab
  '/sounds/down-swipe-left-dislike.mp3',                     // whoosh dislike
];

/**
 * Pool of funny like sounds for the funny theme (right swipe = like).
 * Upbeat, silly sounds that celebrate the match.
 */
export const funnyLikePool: string[] = [
  '/sounds/ding-sfx-472366.mp3',               // classic ding
  '/sounds/duck-quack-like.mp3',               // duck quack
  '/sounds/screenshot-iphone-sound-like.mp3',  // iPhone screenshot click
  '/sounds/achievement-unlocked-463070.mp3',   // achievement unlocked jingle
];

/**
 * Pool of jungle/jaguar sounds for the animal print background theme.
 * Soft purrs and growls — exotic but not scary.
 */
export const jungleSoundPool: string[] = [
  '/sounds/large-gong-2-232438.mp3',
  '/sounds/deep-meditation-bell-hit-heart-chakra-4-186970.mp3',
  '/sounds/bells-2-31725.mp3',
];

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
 * Pick a random item from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Play a random fart/funny dislike sound (for funny theme left swipes)
 * @param volume - Volume level (0.0 to 1.0), default 0.6
 */
export function playFunnyDislike(volume = 0.6): void {
  if (!funnyDislikePool.length) return;
  const audio = new Audio(pickRandom(funnyDislikePool));
  audio.volume = volume;
  audio.play().catch((error) => {
    console.warn('Funny dislike sound playback failed:', error);
  });
}

/**
 * Play a random funny like sound (for funny theme right swipes)
 * @param volume - Volume level (0.0 to 1.0), default 0.6
 */
export function playFunnyLike(volume = 0.6): void {
  if (!funnyLikePool.length) return;
  const audio = new Audio(pickRandom(funnyLikePool));
  audio.volume = volume;
  audio.play().catch((error) => {
    console.warn('Funny like sound playback failed:', error);
  });
}

/**
 * Play a random zen sound from the pool
 * @param volume - Volume level (0.0 to 1.0), default 0.45
 */
export function playRandomZen(volume = 0.45): void {
  const arr = soundMap.randomZen.sounds;
  if (!arr || arr.length === 0) return;

  const audio = new Audio(pickRandom(arr));
  audio.volume = volume;
  audio.play().catch((error) => {
    console.warn('Random zen sound playback failed:', error);
  });
}

/**
 * Play a random jungle/jaguar purr sound
 * @param volume - Volume level (0.0 to 1.0), default 0.3
 */
export function playJungleSound(volume = 0.3): void {
  if (!jungleSoundPool.length) return;
  const audio = new Audio(pickRandom(jungleSoundPool));
  audio.volume = volume;
  audio.play().catch((error) => {
    console.warn('Jungle sound playback failed:', error);
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
  if (!theme || theme === 'none' || theme === 'randomZen' || theme === 'funny') {
    return null;
  }

  const themeMap = soundMap[theme as keyof typeof soundMap];
  if (!themeMap || !('left' in themeMap)) {
    return null;
  }

  return (themeMap as { left: string | null; right: string | null })[direction];
}
