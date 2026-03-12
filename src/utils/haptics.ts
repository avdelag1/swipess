import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { logger } from './prodLogger';

/**
 * Trigger haptic feedback with various patterns
 * - light/medium/heavy: Simple single vibrations
 * - success: Double tap for likes
 * - warning: Double tap with longer pause for passes
 * - error: Single strong vibration
 * - match: Celebratory pattern for mutual matches
 * - celebration: Extended celebration pattern
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'match' | 'celebration') => {
  if (Capacitor.isNativePlatform()) {
    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.impact({ style: ImpactStyle.Light });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 100);
          break;
        case 'warning':
          await Haptics.impact({ style: ImpactStyle.Medium });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 150);
          break;
        case 'error':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'match':
          await Haptics.impact({ style: ImpactStyle.Light });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 100);
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
          break;
        case 'celebration':
          await Haptics.impact({ style: ImpactStyle.Light });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 80);
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 160);
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 250);
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 350);
          break;
      }
    } catch (e) {
      logger.error('Haptics error:', e);
    }
  } else if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([10, 50, 10]);
        break;
      case 'warning':
        navigator.vibrate([20, 100, 20]);
        break;
      case 'error':
        navigator.vibrate(50);
        break;
      case 'match':
        navigator.vibrate([15, 30, 15, 30, 30, 50, 40]);
        break;
      case 'celebration':
        navigator.vibrate([10, 20, 10, 20, 10, 20, 30, 40, 50, 60, 40]);
        break;
    }
  }
};
