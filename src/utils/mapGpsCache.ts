import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { canGeolocate, type GeoOptions, getCurrentPosition } from '@/utils/geolocation';

export type GpsFix = { lat: number; lng: number; accuracy?: number; at: number };

let cached: GpsFix | null = null;
let inflight: Promise<GpsFix | null> | null = null;
let watchActive = false;
let webWatchId: number | null = null;
let nativeWatchId: string | null = null;
let lastEmitAt = 0;

const listeners = new Set<(fix: GpsFix) => void>();
const COORD_EPS = 0.00005;
const EMIT_THROTTLE_MS = 2_500;

function coordsNear(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return Math.abs(a.lat - b.lat) < COORD_EPS && Math.abs(a.lng - b.lng) < COORD_EPS;
}

function emit(fix: GpsFix, force = false) {
  if (cached && coordsNear(cached, fix) && !force) return;
  const now = Date.now();
  if (!force && now - lastEmitAt < EMIT_THROTTLE_MS && cached) return;
  lastEmitAt = now;
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

/** Seed cache from persisted store coords (sync, no permission prompt). */
export function seedGpsCache(lat: number, lng: number): void {
  if (cached && coordsNear(cached, { lat, lng })) return;
  if (cached && Date.now() - cached.at < 60_000) return;
  emit({ lat, lng, at: Date.now() }, true);
}

/**
 * Fetch GPS once — deduped. Only call on explicit map open (not app boot).
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
      emit(fix, true);
      return fix;
    } catch {
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Watch GPS — only while map is open (never on app boot). */
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

export function coordsNearFix(a: { lat: number; lng: number } | null, b: { lat: number; lng: number }): boolean {
  if (!a) return false;
  return coordsNear(a, b);
}