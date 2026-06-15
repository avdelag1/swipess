import { getMapboxAccessToken } from '@/utils/mapboxConfig';

const U = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${w}&q=80`;

/** Generic skyline when no curated or satellite photo is available. */
export const DEFAULT_CITY_PHOTO = U('photo-1449824913935-59a10b8d2000');

export interface PassportQuickCity {
  name: string;
  country: string;
  lat: number;
  lng: number;
  img: string;
}

/** Curated cover photos keyed by normalized city name — each city has a unique image. */
export const CITY_PHOTO_URLS: Record<string, string> = {
  // USA
  'miami': U('photo-1589083130544-0d6a2926e519'),
  'new york': U('photo-1541336032412-2048a678540d'),
  'new york city': U('photo-1541336032412-2048a678540d'),
  'los angeles': U('photo-1580655653885-65763b2597d0'),
  'la': U('photo-1580655653885-65763b2597d0'),
  'las vegas': U('photo-1581351721010-8cf859cb14a4'),
  // Mexico & Central America
  'cancun': U('photo-1510097467424-192d713fd8b2'),
  'cancún': U('photo-1510097467424-192d713fd8b2'),
  'tulum': U('photo-1605216663980-b7ca6e9f2451'),
  'cabo san lucas': U('photo-1562095241-8c6714fd4178'),
  'cartagena': U('photo-1534943441045-1009d7cb0bb9'),
  // Europe
  'paris': U('photo-1511739001486-6bfe10ce785f'),
  'london': U('photo-1513635269975-59663e0ac1ad'),
  'barcelona': U('photo-1583422409516-2895a77efded'),
  'rome': U('photo-1552832230-c0197dd311b5'),
  'ibiza': U('photo-1630347197970-fc4bf0d0334a'),
  'monaco': U('photo-1595138320174-a64d168e9970'),
  'mykonos': U('photo-1601581875309-fafbf2d3ed3a'),
  'santorini': U('photo-1613395877344-13d4a8e0d49e'),
  // Middle East & Africa
  'dubai': U('photo-1739900292622-a7f860175aad'),
  'marrakech': U('photo-1597212618440-806262de4f6b'),
  // Asia Pacific
  'tokyo': U('photo-1513407030348-c983a97b98d8'),
  'bangkok': U('photo-1508009603885-50cf7c579365'),
  'singapore': U('photo-1775306963755-8897be3967bb'),
  'bali': U('photo-1577717903315-1691ae25ab3f'),
  'sydney': U('photo-1506973035872-a4ec16b8e8d9'),
  'seoul': U('photo-1532649097480-b67d52743b69'),
  // Caribbean & South America
  'punta cana': U('photo-1569700946659-fe1941c71fe4'),
  'rio de janeiro': U('photo-1483729558449-99ef09a8c325'),
  'medellin': U('photo-1512250431446-d0b4b57b27ec'),
  'medellín': U('photo-1512250431446-d0b4b57b27ec'),
};

const CITY_ALIASES: Record<string, string> = {
  'nyc': 'new york city',
  'sf': 'san francisco',
  'cdmx': 'mexico city',
  'ciudad de mexico': 'mexico city',
};

export function normalizeCityKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function mapboxSatellitePhoto(lat: number, lng: number, size = 200): string | null {
  const token = getMapboxAccessToken();
  if (!token) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},11,0/${size}x${size}@2x?access_token=${token}`;
}

/**
 * Resolve a cover photo for a city name.
 * Uses curated Unsplash URLs first (exact match only), then Mapbox satellite when coordinates are known.
 */
export function getCityPhoto(
  cityName: string,
  coords?: { lat: number; lng: number },
): string {
  const key = normalizeCityKey(cityName);
  const alias = CITY_ALIASES[key];
  const direct = CITY_PHOTO_URLS[key] ?? (alias ? CITY_PHOTO_URLS[alias] : undefined);
  if (direct) return direct;

  if (coords) {
    const satellite = mapboxSatellitePhoto(coords.lat, coords.lng);
    if (satellite) return satellite;
  }

  return DEFAULT_CITY_PHOTO;
}

/** Horizontal quick-filter strip on the live map — explicit unique cover per city. */
export const PASSPORT_QUICK_CITIES: readonly PassportQuickCity[] = [
  { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918, img: CITY_PHOTO_URLS.miami },
  { name: 'Medellín', country: 'Colombia', lat: 6.2442, lng: -75.5812, img: CITY_PHOTO_URLS['medellín'] || getCityPhoto('Medellín') },
  { name: 'Tulum', country: 'Mexico', lat: 20.2114, lng: -87.4654, img: CITY_PHOTO_URLS.tulum },
  { name: 'Cancún', country: 'Mexico', lat: 21.1619, lng: -86.8515, img: CITY_PHOTO_URLS['cancún'] },
  { name: 'Cabo', country: 'Mexico', lat: 22.8905, lng: -109.9167, img: CITY_PHOTO_URLS['cabo san lucas'] },
  { name: 'Cartagena', country: 'Colombia', lat: 10.3910, lng: -75.4794, img: CITY_PHOTO_URLS.cartagena },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, img: CITY_PHOTO_URLS.dubai },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811, img: CITY_PHOTO_URLS.marrakech },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, img: CITY_PHOTO_URLS.paris },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, img: CITY_PHOTO_URLS.london },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, img: CITY_PHOTO_URLS.rome || getCityPhoto('Rome') },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734, img: CITY_PHOTO_URLS.barcelona },
  { name: 'Ibiza', country: 'Spain', lat: 38.9067, lng: 1.4206, img: CITY_PHOTO_URLS.ibiza },
  { name: 'Mykonos', country: 'Greece', lat: 37.4467, lng: 25.3289, img: CITY_PHOTO_URLS.mykonos },
  { name: 'Santorini', country: 'Greece', lat: 36.3932, lng: 25.4615, img: CITY_PHOTO_URLS.santorini },
  { name: 'Monaco', country: 'Monaco', lat: 43.7384, lng: 7.4246, img: CITY_PHOTO_URLS.monaco },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, img: CITY_PHOTO_URLS['new york'] },
  { name: 'LA', country: 'United States', lat: 34.0522, lng: -118.2437, img: CITY_PHOTO_URLS['los angeles'] },
  { name: 'Las Vegas', country: 'United States', lat: 36.1699, lng: -115.1398, img: CITY_PHOTO_URLS['las vegas'] },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, img: CITY_PHOTO_URLS.tokyo },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, img: CITY_PHOTO_URLS.seoul },
  { name: 'Bali', country: 'Indonesia', lat: -8.4095, lng: 115.1889, img: CITY_PHOTO_URLS.bali },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, img: CITY_PHOTO_URLS.singapore },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, img: CITY_PHOTO_URLS.bangkok },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, img: CITY_PHOTO_URLS.sydney },
  { name: 'Rio', country: 'Brazil', lat: -22.9068, lng: -43.1729, img: CITY_PHOTO_URLS['rio de janeiro'] },
  { name: 'Punta Cana', country: 'Dominican Republic', lat: 18.5601, lng: -68.3725, img: CITY_PHOTO_URLS['punta cana'] },
];

/** Grid cards in the Global Passport sheet. */
export const PREMIUM_DESTINATIONS: readonly PassportQuickCity[] = PASSPORT_QUICK_CITIES;
