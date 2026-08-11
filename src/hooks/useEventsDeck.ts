import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { MOCK_EVENTS } from '@/data/eventsData';
import type { EventItem } from '@/types/events';
import { useFilterStore } from '@/state/filterStore';
import { applyEventLocationFilter } from '@/utils/matchingFilters';
import {
  EVENT_SELECT_BASE,
  EVENT_SELECT_BASE_NO_GEO,
  EVENT_SELECT_WITH_AUDIO,
  EVENT_SELECT_WITH_AUDIO_NO_GEO,
  formatEventRow,
  isMissingAudioColumnError,
  isMissingGeoColumnError,
} from '@/utils/eventsGeo';

export { pickEventImage } from '@/utils/eventsGeo';

/** Events for the main swipe deck — DB rows plus demo cards for onboarding. */
export function useEventsDeck(enabled: boolean) {
  const userLatitude = useFilterStore((s) => s.userLatitude);
  const userLongitude = useFilterStore((s) => s.userLongitude);
  const radiusKm = useFilterStore((s) => s.radiusKm);

  const query = useQuery({
    queryKey: ['eventos', 'swipe-deck', 'v3'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<EventItem[]> => {
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

  const data = useMemo(() => {
    if (!query.data) return query.data;
    return applyEventLocationFilter(query.data, {
      userLatitude,
      userLongitude,
      radiusKm,
    });
  }, [query.data, userLatitude, userLongitude, radiusKm]);

  return { ...query, data };
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
