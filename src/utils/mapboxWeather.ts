import type { Map as MapboxMap } from 'mapbox-gl';

export function enableMapboxSnow(map: MapboxMap) {
  const mapAny = map as any;
  if (mapAny.setConfigProperty) {
    // In Mapbox Standard style, weather is handled via config properties
    // However, if particle systems are used directly:
    if (typeof mapAny.setSnow === 'function') {
      mapAny.setSnow({
        density: 0.8,
        intensity: 1.0,
        'center-thinning': 0.1,
        direction: [0, 20],
        opacity: 1.0,
        color: '#ffffff',
        haloColor: 'rgba(255,255,255,0.5)',
        haloWidth: 0.1,
        size: 0.4,
      });
      // Ensure rain is off
      if (typeof mapAny.setRain === 'function') mapAny.setRain(null);
    }
  }
}

export function enableMapboxRain(map: MapboxMap) {
  const mapAny = map as any;
  if (typeof mapAny.setRain === 'function') {
    mapAny.setRain({
      density: 0.6,
      intensity: 0.8,
      'center-thinning': 0.1,
      direction: [0, 15],
      opacity: 0.4,
      color: '#a3b8c2',
      size: 0.6,
    });
    // Ensure snow is off
    if (typeof mapAny.setSnow === 'function') mapAny.setSnow(null);
  }
}

export function disableMapboxWeather(map: MapboxMap) {
  const mapAny = map as any;
  if (typeof mapAny.setSnow === 'function') mapAny.setSnow(null);
  if (typeof mapAny.setRain === 'function') mapAny.setRain(null);
}
