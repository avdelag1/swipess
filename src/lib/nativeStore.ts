import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/prodLogger';

/**
 * Reliable native-first storage.
 * Replaces localStorage for critical flags (onboarding, biometric consent, session hints, auth state hints).
 * iOS can evict localStorage under memory pressure — this uses NSUserDefaults / SharedPreferences.
 * Falls back to localStorage on web / when plugin unavailable.
 *
 * Usage:
 *   nativeStore.set('swipess_onboarding_seen', 'true')
 *   const seen = await nativeStore.get('swipess_onboarding_seen')
 */
const isNative = () => Capacitor.isNativePlatform();

export const nativeStore = {
  async get(key: string): Promise<string | null> {
    if (isNative()) {
      try {
        const { value } = await Preferences.get({ key });
        return value ?? localStorage.getItem(key); // fallback during migration
      } catch (e) {
        logger.warn(`[NativeStore] get failed for ${key}, falling back to localStorage`, e);
      }
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.set({ key, value });
        // Also write to localStorage during transition period so old code doesn't break
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        logger.warn(`[NativeStore] set failed for ${key}, using localStorage`, e);
      }
    }
    localStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.remove({ key });
      } catch (e) {
        logger.warn(`[NativeStore] remove failed for ${key}`, e);
      }
    }
    localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.clear();
      } catch (e) {
        logger.warn('[NativeStore] clear failed', e);
      }
    }
    // Do not clear all localStorage here — only call for explicit critical clear
  },
};

/**
 * Helper to migrate a batch of keys from localStorage to native on first run.
 * Call once early (e.g. in RootProviders or main bootstrap for native).
 */
export async function migrateCriticalLocalStorageToPreferences(keys: string[]): Promise<void> {
  if (!isNative()) return;

  for (const key of keys) {
    const localVal = localStorage.getItem(key);
    if (localVal !== null) {
      try {
        const { value: prefVal } = await Preferences.get({ key });
        if (prefVal === null) {
          await Preferences.set({ key, value: localVal });
          logger.info(`[NativeStore] Migrated ${key} from localStorage to Preferences`);
        }
        // Keep in localStorage for now (dual write in set() handles transition)
      } catch (e) {
        logger.warn(`[NativeStore] Migration failed for ${key}`, e);
      }
    }
  }
}
