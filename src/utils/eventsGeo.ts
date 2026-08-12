import type { EventItem } from '@/types/events';
import { applyEventLocationFilter } from '@/utils/matchingFilters';
import { useFilterStore } from '@/state/filterStore';
import { supabase } from '@/integrations/supabase/client';

export const EVENT_SELECT_WITH_AUDIO =
  'id, title, description, category, image_url, image_urls, video_url, video_audio_enabled, background_music_url, event_date, location, location_detail, latitude, longitude, visibility_radius_km, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

export const EVENT_SELECT_BASE =
  'id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, latitude, longitude, visibility_radius_km, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

/** Fallback select if geo columns are not migrated yet. */
export const EVENT_SELECT_WITH_AUDIO_NO_GEO =
  'id, title, description, category, image_url, image_urls, video_url, video_audio_enabled, background_music_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

export const EVENT_SELECT_BASE_NO_GEO =
  'id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

export function isMissingGeoColumnError(message?: string | null): boolean {
  return !!message && /latitude|longitude|visibility_radius_km|42703/i.test(message);
}

export function isMissingAudioColumnError(message?: string | null): boolean {
  return !!message && /video_audio_enabled|background_music_url|42703/i.test(message);
}

export function pickEventImage(ev: Partial<EventItem> | Record<string, unknown>): string | null {
  const row = ev as Partial<EventItem> & { image_urls?: unknown };
  if (typeof row.image_url === 'string' && row.image_url.trim()) return row.image_url;
  const gallery = Array.isArray(row.image_urls) ? row.image_urls : [];
  for (const item of gallery) {
    if (typeof item === 'string' && item.trim()) return item;
    if (item && typeof item === 'object') {
      const url =
        (item as { url?: string }).url ||
        (item as { image_url?: string }).image_url ||
        (item as { src?: string }).src;
      if (typeof url === 'string' && url.trim()) return url;
    }
  }
  return null;
}

function toNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatEventRow(ev: Record<string, unknown>): EventItem {
  return {
    id: String(ev.id),
    title: (ev.title as string) || 'Untitled Event',
    description: (ev.description as string) || null,
    category: (ev.category as string) || 'all',
    image_url: pickEventImage(ev),
    image_urls: Array.isArray(ev.image_urls) ? (ev.image_urls as EventItem['image_urls']) : [],
    video_url: (ev.video_url as string) || null,
    video_audio_enabled: !!(ev as { video_audio_enabled?: boolean }).video_audio_enabled,
    background_music_url: ((ev as { background_music_url?: string }).background_music_url as string) || null,
    event_date: (ev.event_date as string) || null,
    location: (ev.location as string) || null,
    location_detail: (ev.location_detail as string) || null,
    latitude: toNum(ev.latitude),
    longitude: toNum(ev.longitude),
    visibility_radius_km: toNum(ev.visibility_radius_km),
    organizer_name: (ev.organizer_name as string) || null,
    organizer_whatsapp: (ev.organizer_whatsapp as string) || null,
    promo_text: (ev.promo_text as string) || null,
    discount_tag: (ev.discount_tag as string) || null,
    is_free: !!ev.is_free,
    price_text: (ev.price_text as string) || null,
  };
}

/** Apply the user's discovery radius (GPS or Passport) to events. */
export function filterEventsForViewerLocation<T extends EventItem>(
  events: T[],
  location?: { userLatitude?: number | null; userLongitude?: number | null; radiusKm?: number },
): T[] {
  if (location) {
    return applyEventLocationFilter(events, location);
  }
  const { userLatitude, userLongitude, radiusKm } = useFilterStore.getState();
  return applyEventLocationFilter(events, {
    userLatitude,
    userLongitude,
    radiusKm,
  });
}

/** Video events first so the feed / quick-filter never open on photo-only mocks. */
export function prioritizeEventsWithVideo<T extends { video_url?: string | null }>(events: T[]): T[] {
  if (events.length < 2) return events;
  const withVideo: T[] = [];
  const without: T[] = [];
  for (const ev of events) {
    if (ev.video_url && String(ev.video_url).trim()) withVideo.push(ev);
    else without.push(ev);
  }
  return withVideo.length ? [...withVideo, ...without] : events;
}

/**
 * Fetch published events with progressive column fallbacks.
 * Prod may not have geo columns yet — try working selects before failing.
 */
export async function fetchEventsFromDb(limit = 100): Promise<EventItem[]> {
  // Prefer no-geo first: production still lacks latitude/longitude columns.
  const selects = [
    EVENT_SELECT_WITH_AUDIO_NO_GEO,
    EVENT_SELECT_BASE_NO_GEO,
    EVENT_SELECT_WITH_AUDIO,
    EVENT_SELECT_BASE,
  ];

  let lastError: { message?: string } | null = null;
  for (const select of selects) {
    const { data, error } = await supabase
      .from('events')
      .select(select)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error) {
      return (data || []).map((ev) => formatEventRow(ev as Record<string, unknown>));
    }
    lastError = error;
    const msg = error.message || '';
    // Only continue on missing-column schema drift
    if (!isMissingGeoColumnError(msg) && !isMissingAudioColumnError(msg)) {
      throw error;
    }
  }

  throw lastError || new Error('Failed to fetch events');
}
