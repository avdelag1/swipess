import type { QueryClient } from '@tanstack/react-query';
import { getCardImageUrl, pwaImagePreloader } from '@/utils/imageOptimization';
import {
  fetchEventsFromDb,
  pickEventImage,
  prioritizeEventsWithVideo,
} from '@/utils/eventsGeo';

/** Raw events cache — location radius is applied in the feed UI. Bump when fetch shape changes. */
const EVENTOS_QUERY_KEY = ['eventos', 'v7'] as const;

export async function prefetchEventosFeed(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: EVENTOS_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const formatted = prioritizeEventsWithVideo(await fetchEventsFromDb(100));

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
