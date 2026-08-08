import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { MOCK_EVENTS } from '@/data/eventsData';
import type { EventItem } from '@/types/events';

export function pickEventImage(ev: Partial<EventItem>): string | null {
  if (typeof ev.image_url === 'string' && ev.image_url.trim()) return ev.image_url;
  const gallery = Array.isArray(ev.image_urls) ? ev.image_urls : [];
  for (const item of gallery) {
    if (typeof item === 'string' && item.trim()) return item;
    if (item && typeof item === 'object') {
      const url = (item as { url?: string; image_url?: string; src?: string }).url
        || (item as { image_url?: string }).image_url
        || (item as { src?: string }).src;
      if (typeof url === 'string' && url.trim()) return url;
    }
  }
  return null;
}

function formatEventRow(ev: Record<string, unknown>): EventItem {
  return {
    id: String(ev.id),
    title: (ev.title as string) || 'Untitled Event',
    description: (ev.description as string) || null,
    category: (ev.category as string) || 'all',
    image_url: pickEventImage(ev as Partial<EventItem>),
    image_urls: Array.isArray(ev.image_urls) ? ev.image_urls : [],
    video_url: (ev.video_url as string) || null,
    video_audio_enabled: !!(ev as any).video_audio_enabled,
    background_music_url: ((ev as any).background_music_url as string) || null,
    event_date: (ev.event_date as string) || null,
    location: (ev.location as string) || null,
    location_detail: (ev.location_detail as string) || null,
    organizer_name: (ev.organizer_name as string) || null,
    organizer_whatsapp: (ev.organizer_whatsapp as string) || null,
    promo_text: (ev.promo_text as string) || null,
    discount_tag: (ev.discount_tag as string) || null,
    is_free: !!ev.is_free,
    price_text: (ev.price_text as string) || null,
  };
}

const EVENT_SELECT_WITH_AUDIO =
  'id, title, description, category, image_url, image_urls, video_url, video_audio_enabled, background_music_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';
const EVENT_SELECT_BASE =
  'id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

/** Events for the main swipe deck — DB rows plus demo cards for onboarding. */
export function useEventsDeck(enabled: boolean) {
  return useQuery({
    queryKey: ['eventos', 'swipe-deck', 'v2'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<EventItem[]> => {
      let { data, error } = await supabase
        .from('events')
        .select(EVENT_SELECT_WITH_AUDIO)
        .order('created_at', { ascending: false })
        .limit(100);

      // Audio columns may not exist until the migration is applied
      if (error && /video_audio_enabled|background_music_url|42703/i.test(error.message || '')) {
        ({ data, error } = await supabase
          .from('events')
          .select(EVENT_SELECT_BASE)
          .order('created_at', { ascending: false })
          .limit(100));
      }

      if (error) {
        logger.warn('[useEventsDeck] fetch error:', error);
        throw error;
      }

      const dbEvents = (data || []).map((row) => formatEventRow(row as Record<string, unknown>));
      const seen = new Set(dbEvents.map((e) => e.id));
      const demos = (MOCK_EVENTS || []).filter((m) => !seen.has(m.id));
      return [...dbEvents, ...demos];
    },
  });
}

export function useEventLikes(userId: string | undefined) {
  return useQuery({
    queryKey: ['event-likes', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', userId)
        .eq('target_type', 'event');
      return new Set((data || []).map((l) => l.target_id));
    },
    enabled: !!userId,
  });
}