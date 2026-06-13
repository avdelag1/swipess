import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { logger } from './prodLogger';

/**
 * Re-engagement local notifications (native only).
 *
 * When the app goes to the background we schedule a couple of friendly nudges a
 * few days out; when the user comes back we cancel them. Net effect: a reminder
 * only ever fires if they DON'T return on their own. No-ops on web/PWA.
 */

// Stable numeric ids so we can cancel exactly what we scheduled.
const REENGAGE_IDS = [88001, 88002];
const DAY_MS = 24 * 60 * 60 * 1000;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (e) {
    logger.error('[LocalNotifications] permission error:', e);
    return false;
  }
}

export async function scheduleReengagementReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    // Replace any previously-scheduled nudges before re-scheduling.
    await cancelReengagementReminders();
    const now = Date.now();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REENGAGE_IDS[0],
          title: 'Your matches miss you 👀',
          body: 'New listings and people are waiting for you on Swipess.',
          schedule: { at: new Date(now + 3 * DAY_MS) },
        },
        {
          id: REENGAGE_IDS[1],
          title: "Don't miss out 🔥",
          body: 'Fresh matches near you — come take a look.',
          schedule: { at: new Date(now + 7 * DAY_MS) },
        },
      ],
    });
  } catch (e) {
    logger.error('[LocalNotifications] schedule error:', e);
  }
}

export async function cancelReengagementReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: REENGAGE_IDS.map((id) => ({ id })) });
  } catch {
    /* nothing scheduled — ignore */
  }
}
