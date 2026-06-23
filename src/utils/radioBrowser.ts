import { CityLocation, RadioStation } from '@/types/radio';

/**
 * Radio-Browser API client (https://www.radio-browser.info) — a free, open
 * community directory of tens of thousands of real, live internet radio
 * stations. The API sends CORS headers, so the browser can query it directly.
 *
 * `all.api.radio-browser.info` is a round-robin DNS across the public mirrors.
 */
const BASE = 'https://all.api.radio-browser.info';

export interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  country: string;
  countrycode: string;
  state: string;
  tags: string;
  codec: string;
  bitrate: number;
  clickcount: number;
}

export interface RadioBrowserQuery {
  name?: string;
  countrycode?: string;
  state?: string;
  tag?: string;
  limit?: number;
}

/**
 * Maps each themed city/topic to a real Radio-Browser query so the city tabs
 * pull genuinely location/genre-specific live stations instead of relabeled
 * duplicates.
 */
export const CITY_RADIO_QUERY: Record<CityLocation, RadioBrowserQuery> = {
  'new-york': { countrycode: 'US', state: 'New York' },
  miami: { countrycode: 'US', state: 'Florida' },
  ibiza: { tag: 'ibiza' },
  tulum: { countrycode: 'MX' },
  california: { countrycode: 'US', state: 'California' },
  texas: { countrycode: 'US', state: 'Texas' },
  french: { countrycode: 'FR' },
  italy: { countrycode: 'IT' },
  podcasts: { tag: 'talk' },
  reggae: { tag: 'reggae' },
  jazz: { tag: 'jazz' },
  arabic: { tag: 'arabic' },
  persian: { tag: 'persian' },
  meditation: { tag: 'meditation' },
  bongs: { tag: 'chillout' },
  london: { countrycode: 'GB', state: 'London' },
  moscow: { countrycode: 'RU' },
  'american-retro': { tag: 'oldies' },
  'sound-healing': { tag: 'ambient' },
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapStation(r: RadioBrowserStation, city: CityLocation): RadioStation {
  const firstTag = (r.tags || '').split(',').map((t) => t.trim()).filter(Boolean)[0];
  const favicon = r.favicon && /^https:\/\//i.test(r.favicon) ? r.favicon : undefined;
  return {
    id: `rb_${r.stationuuid}`,
    name: r.name.trim(),
    frequency: r.bitrate ? `${r.bitrate} kbps` : 'LIVE',
    streamUrl: r.url_resolved,
    city,
    genre: firstTag ? titleCase(firstTag) : undefined,
    description: [r.country, (r.codec || '').toUpperCase()].filter(Boolean).join(' · ') || undefined,
    albumArt: favicon,
  };
}

export async function searchLiveStations(
  query: RadioBrowserQuery,
  city: CityLocation,
  signal?: AbortSignal,
): Promise<RadioStation[]> {
  const params = new URLSearchParams();
  if (query.name) params.set('name', query.name);
  if (query.countrycode) params.set('countrycode', query.countrycode);
  if (query.state) params.set('state', query.state);
  if (query.tag) params.set('tag', query.tag);
  params.set('limit', String(query.limit ?? 50));
  params.set('hidebroken', 'true');
  params.set('order', 'clickcount');
  params.set('reverse', 'true');

  const res = await fetch(`${BASE}/json/stations/search?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`radio-browser ${res.status}`);
  const rows = (await res.json()) as RadioBrowserStation[];

  const seen = new Set<string>();
  const out: RadioStation[] = [];
  for (const r of rows) {
    if (!r?.url_resolved || !r?.name) continue;
    // Only https streams — http would be mixed-content blocked on the https app.
    if (!/^https:\/\//i.test(r.url_resolved)) continue;
    if (seen.has(r.url_resolved)) continue;
    seen.add(r.url_resolved);
    out.push(mapStation(r, city));
  }
  return out;
}

/**
 * Best-effort popularity ping — Radio-Browser asks clients to register a play
 * so its community rankings stay accurate. Fire-and-forget; failures are fine.
 */
export function pingStationClick(stationId: string): void {
  if (!stationId.startsWith('rb_')) return;
  const uuid = stationId.slice(3);
  try {
    fetch(`${BASE}/json/url/${uuid}`).catch(() => {});
  } catch {
    /* ignore */
  }
}
