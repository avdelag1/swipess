import { searchCities } from '@/data/worldLocations';
import { geocodeWithGoogle } from '@/utils/googlePlaces';

export interface PassportAction {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  useGPS?: boolean;
}

export interface ResolvedPassportLocation {
  lat: number;
  lng: number;
  label: string;
}

/** Resolve a city/country (or explicit coords) to lat/lng for Global Passport. */
export async function resolvePassportLocation(
  action: PassportAction,
): Promise<ResolvedPassportLocation | null> {
  if (action.lat != null && action.lng != null) {
    const label = [action.city, action.country].filter(Boolean).join(', ') || 'Selected location';
    return { lat: action.lat, lng: action.lng, label };
  }

  const query = [action.city, action.country].filter(Boolean).join(', ').trim();
  if (!query) return null;

  const localResults = searchCities(query);
  if (localResults.length > 0) {
    let match = localResults[0];
    if (action.country && localResults.length > 1) {
      const countryLower = action.country.toLowerCase();
      match = localResults.find(r => r.country.toLowerCase().includes(countryLower)) ?? localResults[0];
    }
    return {
      lat: match.city.coordinates.lat,
      lng: match.city.coordinates.lng,
      label: `${match.city.name}, ${match.country}`,
    };
  }

  // Fallback: Google Geocoder when Maps JS API is loaded (any city worldwide)
  const googleResult = await geocodeWithGoogle(query);
  if (googleResult) return googleResult;

  return null;
}