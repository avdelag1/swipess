import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { logger } from './prodLogger';

export type HapticLevel = 0 | 1 | 2 | 3;

export const getHapticLevel = (): HapticLevel => {
  if (typeof localStorage === 'undefined') return Capacitor.isNativePlatform() ? 2 : 0;
  const stored = localStorage.getItem('swipess_haptic_level');
  if (stored !== null) {
    const val = parseInt(stored, 10);
    if (val >= 0 && val <= 3) return val as HapticLevel;
  }
  // If old boolean preference exists
  const oldStored = localStorage.getItem('swipess_haptics_enabled');
  if (oldStored === 'false') return 0;
  
  return Capacitor.isNativePlatform() ? 2 : 0;
};

export const setHapticLevel = (level: HapticLevel) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('swipess_haptic_level', level.toString());
    // Keep old one in sync just in case
    localStorage.setItem('swipess_haptics_enabled', (level > 0).toString());
  }
};

/**
 * Trigger haptic feedback adjusted by the user's intensity preference
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'match' | 'celebration') => {
  const level = getHapticLevel();
  if (level === 0) return;

  if (Capacitor.isNativePlatform()) {
    try {
      // Scale down impact based on user level (1 = Light, 2 = Medium, 3 = Heavy)
      const getAdjustedStyle = (base: ImpactStyle) => {
        if (level === 3) return base; // Max intensity
        if (level === 1) return ImpactStyle.Light; // Min intensity
        return base === ImpactStyle.Heavy ? ImpactStyle.Medium : base;
      };

      switch (type) {
        case 'light':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) });
          break;
        case 'medium':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) });
          break;
        case 'heavy':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) });
          break;
        case 'success':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) });
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) }), 100);
          break;
        case 'warning':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) });
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) }), 150);
          break;
        case 'error':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) });
          break;
        case 'match':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) });
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) }), 100);
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) }), 200);
          break;
        case 'celebration':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) });
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) }), 80);
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) }), 160);
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) }), 250);
          setTimeout(() => Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) }), 350);
          break;
      }
    } catch (e) {
      logger.error('Haptics error:', e);
    }
  } else if ('vibrate' in navigator) {
    const scale = level === 1 ? 0.5 : level === 2 ? 1 : 1.5;
    const pattern = (() => {
      switch (type) {
        case 'light': return [5];
        case 'medium': return [10];
        case 'heavy': return [20];
        case 'success': return [5, 30, 5];
        case 'warning': return [10, 60, 10];
        case 'error': return [30];
        case 'match': return [10, 20, 10, 20, 20, 40, 30];
        case 'celebration': return [5, 10, 5, 10, 5, 10, 20, 30, 40, 50, 30];
      }
    })();
    const scaledPattern = pattern.map(p => Math.round(p * scale));
    try { navigator.vibrate(scaledPattern as VibratePattern); } catch { /* vibrate not supported */ }
  }
};

