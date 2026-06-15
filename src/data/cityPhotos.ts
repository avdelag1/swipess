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
  'miami': U('photo-1506966953602-c20cc11cb75b'),
  'new york': U('photo-1496442226666-8d4d0e62e6e9'),
  'new york city': U('photo-1496442226666-8d4d0e62e6e9'),
  'los angeles': U('photo-1515896769750-31548ea180ed'),
  'la': U('photo-1515896769750-31548ea180ed'),
  'san francisco': U('photo-1501594907352-04cda38ebc29'),
  'las vegas': U('photo-1581351721015-39cf7eee2765'),
  'chicago': U('photo-1494522358652-f30e61a603b0'),
  'seattle': U('photo-1502175353170-1a4a738b198f'),
  'austin': U('photo-1531218150218-8f690a343fe2'),
  'denver': U('photo-1612892483236-52d32a0af0bd'),
  'boston': U('photo-1501443762878-497406d0b0c3'),
  'nashville': U('photo-1568605114967-8130f3a36994'),
  'new orleans': U('photo-1514933651103-005eec06c04b'),
  'phoenix': U('photo-1518558212521-2ee8e78df48b'),
  'portland': U('photo-1559164683-ff9139385528'),
  'honolulu': U('photo-1507876382718-a1bace417c37'),
  'atlanta': U('photo-1578519609054-6d2e9f1fdd3d'),
  'philadelphia': U('photo-1564760055775-d519b9ed0ff2'),
  'san diego': U('photo-1605732565002-8a9bc3b79e2c'),
  'palm beach': U('photo-1519046904214-07b3c3f506ed'),
  // Mexico & Central America
  'mexico city': U('photo-1518659526054-0e3ad7c8ef48'),
  'cancun': U('photo-1544551763-46a013bb70d5'),
  'cancún': U('photo-1544551763-46a013bb70d5'),
  'playa del carmen': U('photo-1506905925346-21bda4d32df4'),
  'tulum': U('photo-1518638150340-f706d46ef8b5'),
  'cabo san lucas': U('photo-1519046904214-07b3c3f506ed'),
  'puerto vallarta': U('photo-1551632816-562d395145b0'),
  'guadalajara': U('photo-1578662996442-48f60103fc96'),
  'monterrey': U('photo-1480714378408-67cf0d13bcff'),
  'merida': U('photo-1578662996442-48f60103fc96'),
  'mérida': U('photo-1578662996442-48f60103fc96'),
  'oaxaca': U('photo-1594824476967-48c8b964273f'),
  'ensenada': U('photo-1507525428034-b723cf961d3e'),
  'rosarito': U('photo-1473496169514-62c5ee0c2a30'),
  'la paz': U('photo-1505142468610-359e7d316be0'),
  'tijuana': U('photo-1555881400-74d7acaacd8b'),
  'cartagena': U('photo-1587595431973-160d0d94add3'),
  // Europe
  'paris': U('photo-1502602898657-3e907a5ea82c'),
  'london': U('photo-1513635269975-59663e0ac1ad'),
  'barcelona': U('photo-1583422409516-2895ba84a2c5'),
  'madrid': U('photo-1539037116277-4f208055fd0f'),
  'rome': U('photo-1552832230-c0197dd311b5'),
  'milan': U('photo-1513581166391-887a96ddeafd'),
  'florence': U('photo-1523906834658-6e24ef2386f9'),
  'venice': U('photo-1514890547357-9bb07bc5f0d5'),
  'amsterdam': U('photo-1534351590666-13e3e96b5017'),
  'berlin': U('photo-1560963184-10ffc43632e7'),
  'lisbon': U('photo-1555881400-74d7acaacd8b'),
  'ibiza': U('photo-1559523165-2b4742a78a6c'),
  'monaco': U('photo-1536349788264-1b816af4e27e'),
  'nice': U('photo-1499856877831-d779159fbeb7'),
  'lyon': U('photo-1565008576549-57569a49371d'),
  'marseille': U('photo-1580137189272-c9379f8864fd'),
  'dublin': U('photo-1549893074-2d34a7f3b508'),
  'edinburgh': U('photo-1506377585624-261bcd127b1b'),
  'athens': U('photo-1555993534-abb4167b4415'),
  'prague': U('photo-1541849544259-f9a4f7ba1d3c'),
  'vienna': U('photo-1516550893923-42d8e2e1dbf3'),
  'zurich': U('photo-1528164344725-47549c7a6322'),
  'mykonos': U('photo-1601580113906-7f63532985b9'),
  'santorini': U('photo-1570077185050-3b7d3d8c1b9d'),
  'reykjavik': U('photo-1529963185903-17a19daabb8f'),
  // Middle East & Africa
  'dubai': U('photo-1512453979798-5ea266f8880c'),
  'abu dhabi': U('photo-1518684079-3c830dcef090'),
  'tel aviv': U('photo-1546412414-47fa0a6d0c39'),
  'cairo': U('photo-1572252009286-268ace2105b0'),
  'cape town': U('photo-1580060839134-75a3edda4e13'),
  'marrakech': U('photo-1489749791425-4a3f7d3d3c65'),
  // Asia Pacific
  'tokyo': U('photo-1540959733332-eab4deabeeaf'),
  'bangkok': U('photo-1563492065-73a930c4788a'),
  'singapore': U('photo-1525626928716-6075a1a32ad4'),
  'bali': U('photo-1537996194471-e657df975ab4'),
  'sydney': U('photo-1506973035872-a4ec16b8e8d9'),
  'melbourne': U('photo-1514391191229-fce338212791'),
  'hong kong': U('photo-1536599018104-95f41b835683'),
  'seoul': U('photo-1517154429-7ecfcbbada55'),
  'mumbai': U('photo-1566552881560-a9babe9c638f'),
  'delhi': U('photo-1587474260584-136574528ed5'),
  // Caribbean & South America
  'nassau': U('photo-1544551763-77ef45d0f9f0'),
  'san juan': U('photo-1559127328-8c5c5c3e3b2e'),
  'punta cana': U('photo-1582719478250-c89cae4dc85b'),
  'havana': U('photo-1516026672322-bc52c1122c6b'),
  'buenos aires': U('photo-1589909198275-32f9c6a7d1b2'),
  'rio de janeiro': U('photo-1483729558449-99fb09cad10d'),
  'sao paulo': U('photo-1544984243-be31f48dd170'),
  'são paulo': U('photo-1544984243-be31f48dd170'),
  'bogota': U('photo-1566552881560-a9babe9c638f'),
  'bogotá': U('photo-1566552881560-a9babe9c638f'),
  'medellin': U('photo-1565008576549-57569a49371d'),
  'medellín': U('photo-1565008576549-57569a49371d'),
  'lima': U('photo-1531963860917-7edbc279b198'),
  'santiago': U('photo-1587596981973-160d0d94add3'),
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
