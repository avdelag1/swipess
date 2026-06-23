import { useQuery } from '@tanstack/react-query';
import { CityLocation, RadioStation } from '@/types/radio';
import { CITY_RADIO_QUERY, searchLiveStations } from '@/utils/radioBrowser';

/**
 * Fetches real, live stations from Radio-Browser. Active when the user types a
 * search (>= 2 chars) or selects a themed city/topic; idle otherwise.
 */
export function useLiveRadioStations(params: {
  search: string;
  city: CityLocation | 'all' | 'favorites';
}) {
  const search = params.search.trim();
  const city = params.city;
  const isSearching = search.length >= 2;
  const realCity = city !== 'all' && city !== 'favorites' ? city : null;
  const enabled = isSearching || !!realCity;

  return useQuery<RadioStation[]>({
    queryKey: ['live-radio', isSearching ? `q:${search.toLowerCase()}` : `city:${realCity}`],
    queryFn: ({ signal }) => {
      const themedCity: CityLocation = realCity ?? 'tulum';
      if (isSearching) {
        return searchLiveStations({ name: search, limit: 50 }, themedCity, signal);
      }
      return searchLiveStations({ ...CITY_RADIO_QUERY[realCity as CityLocation], limit: 50 }, themedCity, signal);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}
