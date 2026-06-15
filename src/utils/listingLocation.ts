import { getCityByName } from '@/data/worldLocations';
import { geocodeWithMapbox } from '@/utils/mapboxPlaces';

export const LISTING_LOCATION_REQUIRED_MSG =
  'Select a city from the location picker so your listing appears on the map.';

export type ListingLocationInput = {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  country?: string | null;
  neighborhood?: string | null;
};

export function isValidListingCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): boolean {
  if (latitude == null || longitude == null) return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
  // Reject null island — almost always a bad publish.
  if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) return false;
  return true;
}

/** Resolve map coordinates from explicit GPS or curated city catalog. */
export function resolveListingCoordinatesSync(
  input: ListingLocationInput,
): { latitude: number; longitude: number } | null {
  if (isValidListingCoordinates(input.latitude, input.longitude)) {
    return { latitude: input.latitude!, longitude: input.longitude! };
  }

  const city = input.city?.trim();
  if (!city) return null;

  const cityData = getCityByName(city);
  if (cityData?.city.coordinates) {
    return {
      latitude: cityData.city.coordinates.lat,
      longitude: cityData.city.coordinates.lng,
    };
  }

  return null;
}

/** Sync city catalog first, then Mapbox geocode as fallback. */
export async function resolveListingCoordinates(
  input: ListingLocationInput,
): Promise<{ latitude: number; longitude: number } | null> {
  const synced = resolveListingCoordinatesSync(input);
  if (synced) return synced;

  const city = input.city?.trim();
  if (!city) return null;

  const parts = [city, input.neighborhood?.trim(), input.country?.trim()].filter(Boolean);
  const query = parts.join(', ');
  const geocoded = await geocodeWithMapbox(query);
  if (!geocoded || !isValidListingCoordinates(geocoded.lat, geocoded.lng)) {
    return null;
  }

  return { latitude: geocoded.lat, longitude: geocoded.lng };
}