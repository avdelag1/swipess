/**
 * Google Places / Geocoder helpers.
 *
 * Requires the Maps JavaScript API + Places API to be enabled in Google Cloud,
 * and the script loaded with your API key (already used by GoogleLocationSelector).
 *
 * Setup (when ready):
 * 1. Google Cloud Console → enable "Maps JavaScript API" + "Places API"
 * 2. Add VITE_GOOGLE_MAPS_API_KEY to .env
 * 3. Load script in index.html:
 *    <script src="https://maps.googleapis.com/maps/api/js?key=KEY&libraries=places" async defer></script>
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        Geocoder: new () => {
          geocode: (
            req: { address: string },
            cb: (results: any[] | null, status: string) => void,
          ) => void;
        };
        places?: unknown;
      };
    };
  }
}

/** Geocode any address/city string via Google Maps Geocoder (client-side). */
export async function geocodeWithGoogle(query: string): Promise<GeocodeResult | null> {
  const Geocoder = window.google?.maps?.Geocoder;
  if (!Geocoder || !query.trim()) return null;

  const geocoder = new Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ address: query.trim() }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const loc = results[0].geometry.location;
      resolve({
        lat: loc.lat(),
        lng: loc.lng(),
        label: results[0].formatted_address || query.trim(),
      });
    });
  });
}

/** True when the Google Maps JS SDK (with Geocoder) is available. */
export function isGooglePlacesReady(): boolean {
  return !!window.google?.maps?.Geocoder;
}