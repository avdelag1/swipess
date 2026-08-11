import { supabase } from '@/integrations/supabase/client';
import type { QueryClient } from '@tanstack/react-query';
import { getCardImageUrl, pwaImagePreloader } from '@/utils/imageOptimization';
import {
  EVENT_SELECT_BASE,
  EVENT_SELECT_BASE_NO_GEO,
  EVENT_SELECT_WITH_AUDIO,
  EVENT_SELECT_WITH_AUDIO_NO_GEO,
  formatEventRow,
  isMissingAudioColumnError,
  isMissingGeoColumnError,
  pickEventImage,
} from '@/utils/eventsGeo';

/** Raw events cache — location radius is applied in the feed UI. */
const EVENTOS_QUERY_KEY = ['eventos', 'v6'] as const;

export async function prefetchEventosFeed(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: EVENTOS_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let { data, error } = await supabase
        .from('events')
        .select(EVENT_SELECT_WITH_AUDIO)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error && isMissingGeoColumnError(error.message)) {
        ({ data, error } = await supabase
          .from('events')
          .select(EVENT_SELECT_WITH_AUDIO_NO_GEO)
          .order('created_at', { ascending: false })
          .limit(100));
      }

      if (error && isMissingAudioColumnError(error.message)) {
        ({ data, error } = await supabase
          .from('events')
          .select(EVENT_SELECT_BASE)
          .order('created_at', { ascending: false })
          .limit(100));
        if (error && isMissingGeoColumnError(error.message)) {
          ({ data, error } = await supabase
            .from('events')
            .select(EVENT_SELECT_BASE_NO_GEO)
            .order('created_at', { ascending: false })
            .limit(100));
        }
      }
      if (error) throw error;

      const formatted = (data || []).map((ev) => formatEventRow(ev as Record<string, unknown>));

      const posters = formatted
        .slice(0, 5)
        .map((e) => getCardImageUrl(pickEventImage(e) || ''))
        .filter(Boolean);
      if (posters.length) pwaImagePreloader.batchPreload(posters);

      return formatted;
    },
  });
}

export { EVENTOS_QUERY_KEY };
