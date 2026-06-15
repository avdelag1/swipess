import { resolveMapboxAccessToken } from './mapboxConfig';

export interface TravelTimeResult {
  durationSeconds: number;
  distanceMeters: number;
  formattedDuration: string;
}

export async function getTravelTime(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<TravelTimeResult | null> {
  try {
    const token = await resolveMapboxAccessToken();
    if (!token) return null;

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}?access_token=${token}&overview=false`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const durationSeconds = route.duration;
      
      let formattedDuration = '';
      if (durationSeconds < 60) {
        formattedDuration = '< 1 min';
      } else if (durationSeconds < 3600) {
        formattedDuration = `${Math.round(durationSeconds / 60)} min`;
      } else {
        const hours = Math.floor(durationSeconds / 3600);
        const mins = Math.round((durationSeconds % 3600) / 60);
        formattedDuration = `${hours}h ${mins}m`;
      }

      return {
        durationSeconds: route.duration,
        distanceMeters: route.distance,
        formattedDuration,
      };
    }
    return null;
  } catch (error) {
    console.error('Mapbox Directions error:', error);
    return null;
  }
}
