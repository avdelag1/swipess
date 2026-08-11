import { supabase } from '@/integrations/supabase/client';
import type { QueryClient } from '@tanstack/react-query';
import { getCardImageUrl, pwaImagePreloader } from '@/utils/imageOptimization';

const EVENTOS_QUERY_KEY = ['eventos', 'v5'] as const;

function pickEventImage(ev: any): string | null {
  if (typeof ev?.image_url === 'string' && ev.image_url.trim()) return ev.image_url;
  const gallery = Array.isArray(ev?.image_urls) ? ev.image_urls : [];
  for (const item of gallery) {
    if (typeof item === 'string' && item.trim()) return item;
    if (item && typeof item === 'object') {
      const url = item.url || item.image_url || item.src;
      if (typeof url === 'string' && url.trim()) return url;
    }
  }
  return null;
}

export async function prefetchEventosFeed(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: EVENTOS_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const withAudio =
        'id, title, description, category, image_url, image_urls, video_url, video_audio_enabled, background_music_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';
      const base =
        'id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

      let { data, error } = await supabase
        .from('events')
        .select(withAudio)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error && /video_audio_enabled|background_music_url|42703/i.test(error.message || '')) {
        ({ data, error } = await supabase
          .from('events')
          .select(base)
          .order('created_at', { ascending: false })
          .limit(100));
      }
      if (error) throw error;

      const formatted = (data || []).map((ev: any) => ({
        ...ev,
        title: ev.title || 'Untitled Event',
        category: ev.category || 'all',
        image_url: pickEventImage(ev),
        image_urls: Array.isArray(ev.image_urls) ? ev.image_urls : [],
      }));

      const posters = formatted
        .slice(0, 5)
        .map((e: any) => getCardImageUrl(e.image_url || ''))
        .filter(Boolean);
      if (posters.length) pwaImagePreloader.batchPreload(posters);

      return formatted;
    },
  });
}

export { EVENTOS_QUERY_KEY };
