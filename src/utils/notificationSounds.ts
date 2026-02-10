/**
 * Notification sound utilities for incoming messages and alerts
 * Uses meditation bell sounds for a calm, pleasant notification experience
 */

export type NotificationSoundType = 'message' | 'match' | 'like' | 'general';

/**
 * Notification sound mappings
 * Each notification type has a specific sound
 */
export const notificationSounds = {
  message: '/sounds/bell-a-99888.mp3', // Soft bell for new messages
  match: '/sounds/bells-2-31725.mp3', // Celebratory bells for matches
  like: '/sounds/deep-meditation-bell-hit-heart-chakra-4-186970.mp3', // Heart chakra for likes
  general: '/sounds/deep-meditation-bell-hit-third-eye-chakra-6-186972.mp3', // Third eye for general notifications
};

/**
 * Volume levels for different notification types
 */
const notificationVolumes: Record<NotificationSoundType, number> = {
  message: 0.6, // Slightly louder for messages
  match: 0.7, // Loud for important match notifications
  like: 0.5, // Moderate for likes
  general: 0.5, // Moderate for general notifications
};

/**
 * Play a notification sound
 * @param type - Type of notification
 * @returns Promise that resolves when sound starts playing
 */
export async function playNotificationSound(type: NotificationSoundType = 'general'): Promise<void> {
  try {
    const soundPath = notificationSounds[type];
    const volume = notificationVolumes[type];

    if (!soundPath) {
      console.warn('No sound defined for notification type:', type);
      return;
    }

    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.preload = 'auto';

    await audio.play();
  } catch (error) {
    // Fail silently - don't disrupt user experience if sound fails
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Preload notification sounds for instant playback
 * Call this on app initialization
 */
export function preloadNotificationSounds(): void {
  Object.values(notificationSounds).forEach((soundPath) => {
    if (soundPath) {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      audio.load();
    }
  });
}

/**
 * Check if notification sounds are enabled
 * Respects browser autoplay policies
 */
export function canPlayNotificationSounds(): boolean {
  try {
    // Check if Audio is supported
    if (typeof Audio === 'undefined') {
      return false;
    }

    // Check if we're in a secure context (required for some browsers)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      console.warn('Notification sounds require a secure context (HTTPS)');
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Cannot determine if notification sounds are available:', error);
    return false;
  }
}
