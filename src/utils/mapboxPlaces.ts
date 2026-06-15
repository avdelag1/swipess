import { getMapboxAccessToken, isMapboxConfigured } from '@/utils/mapboxConfig';

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

/** Geocode any address/city string via Mapbox Geocoder REST API. */
export async function geocodeWithMapbox(query: string): Promise<GeocodeResult | null> {
  const token = getMapboxAccessToken();
  if (!token || !query.trim()) return null;

  try {
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?access_token=${token}&types=place,address,poi&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;
      return {
        lat,
        lng,
        label: feature.place_name || query.trim(),
      };
    }
  } catch (err) {
    console.error('Mapbox geocoding error:', err);
  }
  return null;
}

/** Search cities/places worldwide via Mapbox forward geocoding. */
export async function searchMapboxPlaces(query: string, limit = 8): Promise<GeocodeResult[]> {
  const token = getMapboxAccessToken();
  if (!token || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?access_token=${token}&types=place,locality,region,country&limit=${limit}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f: any) => {
      const [lng, lat] = f.center;
      return { lat, lng, label: f.place_name as string };
    });
  } catch {
    return [];
  }
}

/** True when the Mapbox token is available. */
export function isMapboxPlacesReady(): boolean {
  return isMapboxConfigured();
}
