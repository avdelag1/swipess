import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { isValidListingCoordinates, resolveListingCoordinatesSync } from '@/utils/listingLocation';

const MIN_WRITE_INTERVAL_MS = 30_000;
const MIN_MOVE_DEG = 0.001; // ~100m

let lastWrite: { lat: number; lng: number; at: number; userId: string } | null = null;
const backfillAttempted = new Set<string>();

/**
 * Persist device GPS to client_profiles for live map "people" pins.
 * Always stamps location_source = 'device' + location_updated_at so the
 * passport map never confuses this with city-centroid backfills.
 * Throttled — safe to call on every GPS tick / login.
 */
export async function persistClientProfileGps(
  userId: string,
  lat: number,
  lng: number,
): Promise<void> {
  if (!userId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const now = Date.now();
  if (
    lastWrite?.userId === userId
    && now - lastWrite.at < MIN_WRITE_INTERVAL_MS
    && Math.abs(lat - lastWrite.lat) < MIN_MOVE_DEG
    && Math.abs(lng - lastWrite.lng) < MIN_MOVE_DEG
  ) {
    return;
  }

  const { error } = await supabase
    .from('client_profiles')
    .update({
      latitude: lat,
      longitude: lng,
      location_updated_at: new Date().toISOString(),
      location_source: 'device',
    })
    .eq('user_id', userId);

  if (error) {
    // Older DBs without the new columns — still write lat/lng so map can show something
    if (/location_updated_at|location_source|column/i.test(error.message)) {
      const { error: fallbackErr } = await supabase
        .from('client_profiles')
        .update({ latitude: lat, longitude: lng })
        .eq('user_id', userId);
      if (fallbackErr) {
        logger.warn('[persistProfileGps] update failed:', fallbackErr.message);
        return;
      }
    } else {
      logger.warn('[persistProfileGps] update failed:', error.message);
      return;
    }
  }

  lastWrite = { lat, lng, at: now, userId };
}

/**
 * City-only approximate coords for non-map UX (e.g. city label).
 * NEVER used as live map presence — location_source stays 'city'.
 */
export async function backfillProfileGpsFromCity(userId: string): Promise<boolean> {
  if (!userId || backfillAttempted.has(userId)) return false;
  backfillAttempted.add(userId);

  const { data: profile, error } = await supabase
    .from('client_profiles')
    .select('latitude, longitude, city, country, neighborhood, location_source')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !profile) return false;
  // Already has real device GPS — leave it alone
  if ((profile as { location_source?: string }).location_source === 'device') return false;
  if (isValidListingCoordinates(profile.latitude, profile.longitude)
    && (profile as { location_source?: string }).location_source === 'device') {
    return false;
  }

  const coords = resolveListingCoordinatesSync({
    city: profile.city,
    country: profile.country,
    neighborhood: profile.neighborhood,
  });
  if (!coords) return false;

  const { error: updateError } = await supabase
    .from('client_profiles')
    .update({
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_source: 'city',
      // Do NOT set location_updated_at — city pins must not appear on live map
    })
    .eq('user_id', userId);

  if (updateError) {
    logger.warn('[persistProfileGps] city backfill failed:', updateError.message);
    return false;
  }

  return true;
}
