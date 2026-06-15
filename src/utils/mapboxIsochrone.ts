import { resolveMapboxAccessToken } from './mapboxConfig';

export async function getIsochrone(
  lng: number,
  lat: number,
  minutes: number,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const token = await resolveMapboxAccessToken();
    if (!token) return null;

    // Mapbox Isochrone API expects contours_minutes as a comma-separated list
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${token}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.type === 'FeatureCollection') {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Mapbox Isochrone error:', error);
    return null;
  }
}
