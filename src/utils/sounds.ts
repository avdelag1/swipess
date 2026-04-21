/**
 * Sound management utility for swipe interactions
 * Provides customizable sound themes for left/right swipes
 * All pools are LAZY LOADED on first use - NOT at module import
 * This prevents 9.7MB of audio from loading on landing page
 */

export type SwipeTheme = 'none' | 'book' | 'water' | 'funny' | 'calm' | 'randomZen';

export const soundMap = {
  none: { left: null as null | string, right: null as null | string },
  book: {
    left: '/sounds/book-closing-466850.mp3',
    right: '/sounds/page-turned-84574.mp3'
  },
  water: {
    left: '/sounds/water-splash-46402.mp3',
    right: '/sounds/water-droplet-sfx-417690.mp3'
  },
  funny: { left: null as null | string, right: null as null | string },
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
      '/sounds/large-gong-2-232438.mp3',
      '/sounds/tuning-fork-440-hz-resonance-22406.mp3',
      '/sounds/singing-bowl-gong-69238.mp3',
      '/sounds/bells-1-72261.mp3',
      '/sounds/bell-meditation-75335.mp3',
      '/sounds/gong-bell-singing-bowl-modified-61150.mp3',
      '/sounds/deep-meditation-bell-hit-solar-plexus-chakra-3-186969.mp3',
      '/sounds/deep-meditation-bell-hit-sacral-chakra-2-186968.mp3',
      '/sounds/deep-meditation-bell-hit-root-chakra-8-186974.mp3',
      '/sounds/deep-meditation-bell-hit-crown-chakra-7-186973.mp3',
      '/sounds/deep-meditation-bell-hit-throat-chakra-5-186971.mp3',
      '/sounds/deep-meditation-bell-hit-root-chakra-1-174455.mp3'
    ]
  }
};

export const funnyDislikePool: string[] = [
  '/sounds/funny-short-comedy-fart-sound-effect-318912.mp3',
  '/sounds/whistle-slide-down-dislike.mp3',
  '/sounds/funny-cartoon-drum-dislike.mp3',
  '/sounds/down-swipe-left-dislike.mp3',
];

export const funnyLikePool: string[] = [
  '/sounds/ding-sfx-472366.mp3',
  '/sounds/duck-quack-like.mp3',
  '/sounds/screenshot-iphone-sound-like.mp3',
  '/sounds/achievement-unlocked-463070.mp3',
];

export const jungleSoundPool: string[] = [
  '/sounds/large-gong-2-232438.mp3',
  '/sounds/deep-meditation-bell-hit-heart-chakra-4-186970.mp3',
  '/sounds/bells-2-31725.mp3',
  '/sounds/singing-bowl-gong-69238.mp3',
  '/sounds/gong-bell-singing-bowl-modified-61150.mp3',
  '/sounds/deep-meditation-bell-hit-root-chakra-8-186974.mp3',
];

export const themeDisplayNames: Record<SwipeTheme, string> = {
  none: 'None',
  book: 'Book Pages',
  water: 'Water Drop',
  funny: 'Funny',
  calm: 'Calm Bells',
  randomZen: 'Random Zen'
};

// LAZY LOADING: Audio pools are created on first use, not at module load
// This dramatically improves initial app load time by ~2-5 seconds
// Original was: const preloadedZen = preloadPool(...); at module level

// Lazy-loaded audio pools - only created when needed
let preloadedZen: HTMLAudioElement[] | null = null;
let preloadedJungle: HTMLAudioElement[] | null = null;
let preloadedFunnyDislike: HTMLAudioElement[] | null = null;
let preloadedFunnyLike: HTMLAudioElement[] | null = null;

// Sequential round-robin indices
let zenIndex = 0;
let jungleIndex = 0;
let funnyDislikeIndex = 0;
let funnyLikeIndex = 0;

// Lazy initialization - only creates audio elements when first used
function getOrCreatePool(
  poolRef: HTMLAudioElement[] | null,
  paths: string[],
  volume: number
): HTMLAudioElement[] {
  if (poolRef) return poolRef;
  
  // Create pool lazily on first use
  const pool = paths.map(p => {
    const a = new Audio(p);
    a.preload = 'auto';
    a.volume = volume;
    return a;
  });
  
  return pool;
}

// Initialize lazy pools
function ensureZenPool(): HTMLAudioElement[] {
  if (!preloadedZen) {
    preloadedZen = getOrCreatePool(preloadedZen, soundMap.randomZen.sounds, 0.45);
  }
  return preloadedZen;
}

function ensureJunglePool(): HTMLAudioElement[] {
  if (!preloadedJungle) {
    preloadedJungle = getOrCreatePool(preloadedJungle, jungleSoundPool, 0.3);
  }
  return preloadedJungle;
}

function ensureFunnyDislikePool(): HTMLAudioElement[] {
  if (!preloadedFunnyDislike) {
    preloadedFunnyDislike = getOrCreatePool(preloadedFunnyDislike, funnyDislikePool, 0.6);
  }
  return preloadedFunnyDislike;
}

function ensureFunnyLikePool(): HTMLAudioElement[] {
  if (!preloadedFunnyLike) {
    preloadedFunnyLike = getOrCreatePool(preloadedFunnyLike, funnyLikePool, 0.6);
  }
  return preloadedFunnyLike;
}

function playFromPool(pool: HTMLAudioElement[], index: number, volume?: number): void {
  if (!pool.length) return;
  const audio = pool[index % pool.length];
  if (volume !== undefined) audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

/** Play next zen sound in sequence */
export function playRandomZen(volume = 0.45): void {
  playFromPool(ensureZenPool(), zenIndex, volume);
  zenIndex++;
}

/** Play next jungle sound in sequence */
export function playJungleSound(volume = 0.3): void {
  playFromPool(ensureJunglePool(), jungleIndex, volume);
  jungleIndex++;
}

/** Play next funny dislike sound in sequence */
export function playFunnyDislike(volume = 0.6): void {
  playFromPool(ensureFunnyDislikePool(), funnyDislikeIndex, volume);
  funnyDislikeIndex++;
}

/** Play next funny like sound in sequence */
export function playFunnyLike(volume = 0.6): void {
  playFromPool(ensureFunnyLikePool(), funnyLikeIndex, volume);
  funnyLikeIndex++;
}

// --- Utility functions (unchanged) ---

export function createAudio(src: string | null, volume = 0.5): HTMLAudioElement | null {
  if (!src) return null;
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = volume;
  try { audio.load(); } catch { /* ignore */ }
  return audio;
}

export function playSound(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch { /* ignore */ }
}

export function getSoundForTheme(
  theme: SwipeTheme,
  direction: 'left' | 'right'
): string | null {
  if (!theme || theme === 'none' || theme === 'randomZen' || theme === 'funny') return null;
  const themeMap = soundMap[theme as keyof typeof soundMap];
  if (!themeMap || !('left' in themeMap)) return null;
  return (themeMap as { left: string | null; right: string | null })[direction];
}


