/**
 * Notification sound utilities for incoming messages and alerts
 * Respects the user's chosen swipe sound theme — including funny mode!
 */

import type { SwipeTheme } from './sounds';
import { logger } from '@/utils/prodLogger';

export type NotificationSoundType = 'message' | 'match' | 'like' | 'general';

/**
 * Standard (calm) notification sound mappings
 */
const notificationSounds = {
  message: '/sounds/bell-meditation-75335.mp3',
  match:   '/sounds/singing-bowl-gong-69238.mp3',
  like:    '/sounds/deep-meditation-bell-hit-sacral-chakra-2-186968.mp3',
  general: '/sounds/tuning-fork-440-hz-resonance-22406.mp3',
};

/**
 * Funny notification sound pool — random pick each time so it never gets old.
 * These also work as "like" / celebratory notifications in funny mode.
 */
const funnyNotificationPool: string[] = [
  '/sounds/achievement-unlocked-463070.mp3',  // achievement jingle
  '/sounds/duck-quack-like.mp3',              // duck quack
  '/sounds/ding-sfx-472366.mp3',              // classic ding
  '/sounds/screenshot-iphone-sound-like.mp3', // iPhone click
];

/**
 * Volume levels for different notification types
 */
const notificationVolumes: Record<NotificationSoundType, number> = {
  message: 0.6,
  match:   0.7,
  like:    0.5,
  general: 0.5,
};

/**
 * Module-level theme store — kept in sync with the user's swipe theme
 * via setNotificationSoundTheme() called from useSwipeSounds.
 */
let currentTheme: SwipeTheme = 'none';

/**
 * Sync notification sounds with the user's active swipe theme.
 * Call this whenever the theme is loaded or changed.
 */
export function setNotificationSoundTheme(theme: SwipeTheme): void {
  currentTheme = theme;
}

/**
 * Pick a random item from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Play a notification sound.
 * When the user's swipe theme is "funny", plays a random funny sound instead
 * of the standard calm bell.
 *
 * @param type - Type of notification
 */
export async function playNotificationSound(type: NotificationSoundType = 'general'): Promise<void> {
  try {
    let soundPath: string;
    const volume = notificationVolumes[type];

    if (currentTheme === 'funny' && funnyNotificationPool.length > 0) {
      soundPath = pickRandom(funnyNotificationPool);
    } else {
      soundPath = notificationSounds[type];
    }

    if (!soundPath) {
      logger.warn('No sound defined for notification type:', type);
      return;
    }

    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.preload = 'auto';

    await audio.play();
  } catch (error) {
    // Fail silently — don't disrupt user experience if sound fails
    logger.warn('Failed to play notification sound:', error);
  }
}

/**
 * Preload notification sounds for instant playback.
 * Preloads both standard and funny pools so switching themes feels instant.
 */
export function preloadNotificationSounds(): void {
  const allSounds = [
    ...Object.values(notificationSounds),
    ...funnyNotificationPool,
  ];

  allSounds.forEach((soundPath) => {
    if (soundPath) {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      audio.load();
    }
  });
}

/**
 * Check if notification sounds are enabled.
 * Respects browser autoplay policies.
 */
export function canPlayNotificationSounds(): boolean {
  try {
    if (typeof Audio === 'undefined') {
      return false;
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      logger.warn('Notification sounds require a secure context (HTTPS)');
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('Cannot determine if notification sounds are available:', error);
    return false;
  }
}


