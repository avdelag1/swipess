import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { isValidListingCoordinates, resolveListingCoordinatesSync } from '@/utils/listingLocation';

const MIN_WRITE_INTERVAL_MS = 30_000;
const MIN_MOVE_DEG = 0.001; // ~100m

let lastWrite: { lat: number; lng: number; at: number; userId: string } | null = null;
const backfillAttempted = new Set<string>();

/**
 * Persist device GPS to client_profiles so map "people" pins work in production.
 * Throttled — safe to call on every GPS tick.
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
    .update({ latitude: lat, longitude: lng })
    .eq('user_id', userId);

  if (error) {
    logger.warn('[persistProfileGps] update failed:', error.message);
    return;
  }

  lastWrite = { lat, lng, at: now, userId };
}

/**
 * One-time backfill: users with a city but no GPS coords get approximate map pins.
 */
export async function backfillProfileGpsFromCity(userId: string): Promise<boolean> {
  if (!userId || backfillAttempted.has(userId)) return false;
  backfillAttempted.add(userId);

  const { data: profile, error } = await supabase
    .from('client_profiles')
    .select('latitude, longitude, city, country, neighborhood')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !profile) return false;
  if (isValidListingCoordinates(profile.latitude, profile.longitude)) return false;

  const coords = resolveListingCoordinatesSync({
    city: profile.city,
    country: profile.country,
    neighborhood: profile.neighborhood,
  });
  if (!coords) return false;

  const { error: updateError } = await supabase
    .from('client_profiles')
    .update({ latitude: coords.latitude, longitude: coords.longitude })
    .eq('user_id', userId);

  if (updateError) {
    logger.warn('[persistProfileGps] city backfill failed:', updateError.message);
    return false;
  }

  lastWrite = { lat: coords.latitude, lng: coords.longitude, at: Date.now(), userId };
  return true;
}