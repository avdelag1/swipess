import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Native-first geolocation.
 *
 * On a device we use the Capacitor Geolocation plugin (real GPS + proper
 * iOS/Android permission prompts); on web/PWA we fall back to the browser
 * `navigator.geolocation`. Both return the same simple `{ latitude, longitude,
 * accuracy }` shape so call sites don't care which path ran. Mirrors the
 * graceful-fallback pattern used by `haptics.ts` and `useSharing.ts`.
 */

export interface SimpleCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/** True when location is obtainable: native always, or web when the API exists. */
export function canGeolocate(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Resolve the device's current position. Rejects if location is unavailable,
 * the user denies permission, or the request times out — callers should catch
 * and degrade gracefully (the app only ever requests location on an explicit
 * user gesture, never on mount).
 */
export async function getCurrentPosition(options: GeoOptions = {}): Promise<SimpleCoords> {
  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 60000 } = options;

  if (Capacitor.isNativePlatform()) {
    const status = await Geolocation.checkPermissions();
    if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
        throw new Error('Location permission denied');
      }
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy, timeout, maximumAge });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  }

  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation not available');
  }
  return new Promise<SimpleCoords>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy, timeout, maximumAge },
    );
  });
}
