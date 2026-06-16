import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { canGeolocate, getCurrentPosition, type GeoOptions } from '@/utils/geolocation';

export type GpsFix = { lat: number; lng: number; accuracy?: number; at: number };

let cached: GpsFix | null = null;
let inflight: Promise<GpsFix | null> | null = null;
let watchActive = false;
let webWatchId: number | null = null;
let nativeWatchId: string | null = null;

const listeners = new Set<(fix: GpsFix) => void>();

function emit(fix: GpsFix) {
  cached = fix;
  for (const fn of listeners) fn(fix);
}

/** Last known device position — survives map open/close and component remounts. */
export function getCachedGpsFix(): GpsFix | null {
  return cached;
}

export function subscribeGpsFix(fn: (fix: GpsFix) => void): () => void {
  listeners.add(fn);
  if (cached) fn(cached);
  return () => listeners.delete(fn);
}

/** Seed cache from persisted store coords (better than nothing while GPS warms). */
export function seedGpsCache(lat: number, lng: number): void {
  if (cached && Date.now() - cached.at < 60_000) return;
  emit({ lat, lng, at: Date.now() });
}

/**
 * Fetch GPS once — deduped. Uses short maximumAge for speed on repeat calls.
 * Safe to call on dashboard warm-start and every map open.
 */
export async function prefetchUserGps(options?: GeoOptions): Promise<GpsFix | null> {
  if (!canGeolocate()) return cached;

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const pos = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 15_000,
        ...options,
      });
      const fix: GpsFix = {
        lat: pos.latitude,
        lng: pos.longitude,
        accuracy: pos.accuracy,
        at: Date.now(),
      };
      emit(fix);
      return fix;
    } catch {
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Keep cache fresh while the app is on dashboard / map is warm. */
export function startGpsWatch(): void {
  if (watchActive || !canGeolocate()) return;
  watchActive = true;

  const apply = (latitude: number, longitude: number, accuracy?: number) => {
    emit({ lat: latitude, lng: longitude, accuracy, at: Date.now() });
  };

  if (Capacitor.isNativePlatform()) {
    void Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
      (pos, err) => {
        if (err || !pos) return;
        apply(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
    ).then((id) => { nativeWatchId = id; });
    return;
  }

  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    webWatchId = navigator.geolocation.watchPosition(
      (pos) => apply(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => undefined,
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
    );
  }
}

export function stopGpsWatch(): void {
  watchActive = false;
  if (webWatchId != null && typeof navigator !== 'undefined') {
    navigator.geolocation.clearWatch(webWatchId);
    webWatchId = null;
  }
  if (nativeWatchId != null) {
    void Geolocation.clearWatch({ id: nativeWatchId });
    nativeWatchId = null;
  }
}