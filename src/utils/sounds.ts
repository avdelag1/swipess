/**
 * Sound management utility for swipe interactions
 * Provides customizable sound themes for left/right swipes
 * All pools are LAZY LOADED on first use - NOT at module import
 * This prevents 9.7MB of audio from loading on landing page
 */

export type SwipeTheme = 'none' | 'default';

export const soundMap = {
  none: { left: null as null | string, right: null as null | string },
  default: {
    left: '/sounds/text-notification-96707.mp3', // Pop/swish sound for pass
    right: '/sounds/achievement-unlocked-463070.mp3' // Pleasant ding for like
  }
};

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
  if (!theme || theme === 'none') return null;
  const themeMap = soundMap[theme as keyof typeof soundMap];
  if (!themeMap || !('left' in themeMap)) return null;
  return themeMap[direction] as string | null;
}


