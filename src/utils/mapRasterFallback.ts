/**
 * Non-WebGL map fallback (Leaflet + Mapbox raster tiles).
 * Used when Mapbox GL loses its WebGL context (Safari / old iPhones).
 * Pins and pan/zoom work; no 3D / fog / cinematic pitch.
 */

import type { Circle, CircleMarker, Map as LeafletMap, Marker } from 'leaflet';

export type RasterMapHandle = {
  map: LeafletMap;
  L: typeof import('leaflet');
  setRadius: (lat: number, lng: number, radiusKm: number) => void;
  setGpsDot: (lat: number, lng: number) => void;
  clearGpsDot: () => void;
  flyTo: (lat: number, lng: number, zoom: number) => void;
  setView: (lat: number, lng: number, zoom: number) => void;
  destroy: () => void;
  onLongPress: (cb: (lng: number, lat: number) => void) => () => void;
  onUserInteract: (cb: () => void) => () => void;
};

let leafletCssLoaded = false;

async function ensureLeafletCss(): Promise<void> {
  if (leafletCssLoaded || typeof document === 'undefined') return;
  await import('leaflet/dist/leaflet.css');
  leafletCssLoaded = true;
}

/** Inject once — Leaflet default divIcon is a white square we must kill. */
export function ensureRasterMapStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('swipess-raster-map-css')) return;
  const style = document.createElement('style');
  style.id = 'swipess-raster-map-css';
  style.textContent = `
    .swipess-raster-map { width:100%; height:100%; z-index:0; background:#1a1a2e; }
    .swipess-raster-map .leaflet-container { width:100%; height:100%; background:#1a1a2e; font: inherit; }
    .swipess-raster-marker {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      /* Leaflet defaults can clip custom HTML markers */
      overflow: visible !important;
    }
    .swipess-raster-marker-host {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      pointer-events: auto;
      overflow: visible !important;
    }
    .swipess-raster-marker .passport-map-marker {
      filter: none !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    .leaflet-marker-pane { z-index: 600 !important; }
    .leaflet-overlay-pane { z-index: 400 !important; }
  `;
  document.head.appendChild(style);
}

/** Mapbox classic raster tiles — no WebGL. */
function tileUrl(token: string): string {
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${encodeURIComponent(token)}`;
}

/**
 * Leaflet stamps `_leaflet_id` on the container. Removing children is not enough —
 * a second L.map() on the same node throws "Map container is already initialized."
 */
export function resetLeafletContainer(container: HTMLElement): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = container as any;
  try {
    // If Leaflet still has a live map, remove() clears the stamp cleanly
    if (el._leaflet_id != null) {
      // Prefer official teardown when we can reach the instance via private map ref
      // stored on the element after init (not always available).
      delete el._leaflet_id;
    }
  } catch { /* empty */ }
  try {
    container.innerHTML = '';
  } catch {
    while (container.firstChild) container.removeChild(container.firstChild);
  }
  container.classList.remove('swipess-raster-map', 'leaflet-container', 'leaflet-touch', 'leaflet-fade-anim', 'leaflet-grab', 'leaflet-touch-drag', 'leaflet-touch-zoom');
  // Drop any leftover leaflet-* classes from a prior instance
  container.className = container.className
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('leaflet-'))
    .join(' ');
}

export async function createRasterMap(
  container: HTMLElement,
  opts: {
    token: string;
    center: { lat: number; lng: number };
    zoom: number;
  },
): Promise<RasterMapHandle> {
  await ensureLeafletCss();
  ensureRasterMapStyles();
  const L = (await import('leaflet')).default;

  // Wipe Mapbox canvas leftovers + prior Leaflet stamp on this node
  resetLeafletContainer(container);
  container.classList.add('swipess-raster-map');

  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
    maxZoom: 18,
    minZoom: 2,
  }).setView([opts.center.lat, opts.center.lng], opts.zoom);

  L.tileLayer(tileUrl(opts.token), {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 18,
    // Keep attribution out of UI chrome; Mapbox ToS still requires it in app About/legal.
    attribution: '',
  }).addTo(map);

  // Fix default icon paths broken under Vite bundling (we use custom HTML markers only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  let radiusCircle: Circle | null = null;
  let gpsDot: CircleMarker | null = null;

  const setRadius = (lat: number, lng: number, radiusKm: number) => {
    const meters = Math.max(100, radiusKm * 1000);
    if (radiusCircle) {
      radiusCircle.setLatLng([lat, lng]);
      radiusCircle.setRadius(meters);
      return;
    }
    radiusCircle = L.circle([lat, lng], {
      radius: meters,
      color: '#00C6FF',
      weight: 2,
      opacity: 0.85,
      fillColor: '#00C6FF',
      fillOpacity: 0.12,
    }).addTo(map);
  };

  const setGpsDot = (lat: number, lng: number) => {
    if (gpsDot) {
      gpsDot.setLatLng([lat, lng]);
      return;
    }
    gpsDot = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#0072FF',
      fillOpacity: 1,
    }).addTo(map);
  };

  const clearGpsDot = () => {
    if (gpsDot) {
      map.removeLayer(gpsDot);
      gpsDot = null;
    }
  };

  const flyTo = (lat: number, lng: number, zoom: number) => {
    map.flyTo([lat, lng], zoom, { duration: 0.45 });
  };

  const setView = (lat: number, lng: number, zoom: number) => {
    map.setView([lat, lng], zoom, { animate: false });
  };

  const onLongPress = (cb: (lng: number, lat: number) => void) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let start: { x: number; y: number } | null = null;

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      start = null;
    };

    const onDown = (e: L.LeafletMouseEvent) => {
      const oe = e.originalEvent as PointerEvent | TouchEvent | MouseEvent;
      const pt =
        'clientX' in oe
          ? { x: oe.clientX, y: oe.clientY }
          : (oe as TouchEvent).touches?.[0]
            ? { x: (oe as TouchEvent).touches[0].clientX, y: (oe as TouchEvent).touches[0].clientY }
            : null;
      if (!pt) return;
      start = pt;
      timer = setTimeout(() => {
        if (!start) return;
        cb(e.latlng.lng, e.latlng.lat);
        clear();
      }, 1000);
    };

    const onMove = (e: L.LeafletMouseEvent) => {
      if (!start || !timer) return;
      const oe = e.originalEvent as PointerEvent | TouchEvent | MouseEvent;
      const x = 'clientX' in oe ? oe.clientX : (oe as TouchEvent).touches?.[0]?.clientX;
      const y = 'clientY' in oe ? oe.clientY : (oe as TouchEvent).touches?.[0]?.clientY;
      if (x == null || y == null) return;
      if (Math.hypot(x - start.x, y - start.y) > 12) clear();
    };

    map.on('mousedown', onDown);
    map.on('touchstart', onDown as (e: L.LeafletEvent) => void);
    map.on('mousemove', onMove);
    map.on('touchmove', onMove as (e: L.LeafletEvent) => void);
    map.on('mouseup', clear);
    map.on('touchend', clear);
    map.on('mouseleave', clear);

    return () => {
      clear();
      map.off('mousedown', onDown);
      map.off('touchstart', onDown as (e: L.LeafletEvent) => void);
      map.off('mousemove', onMove);
      map.off('touchmove', onMove as (e: L.LeafletEvent) => void);
      map.off('mouseup', clear);
      map.off('touchend', clear);
      map.off('mouseleave', clear);
    };
  };

  const onUserInteract = (cb: () => void) => {
    const handler = () => cb();
    map.on('dragstart', handler);
    map.on('zoomstart', handler);
    return () => {
      map.off('dragstart', handler);
      map.off('zoomstart', handler);
    };
  };

  // Leaflet needs an explicit invalidate after the container becomes visible
  requestAnimationFrame(() => {
    try {
      map.invalidateSize({ animate: false });
    } catch { /* empty */ }
  });

  const destroy = () => {
    try {
      map.remove();
    } catch { /* empty */ }
    resetLeafletContainer(container);
  };

  return {
    map,
    L,
    setRadius,
    setGpsDot,
    clearGpsDot,
    flyTo,
    setView,
    destroy,
    onLongPress,
    onUserInteract,
  };
}

export type RasterMarkerEntry = {
  marker: Marker;
  el: HTMLDivElement;
  cleanup: () => void;
  pinType: 'listing' | 'profile' | 'cluster';
  pinId: string;
};

/**
 * Leaflet divIcon that hosts our existing Mapbox-style pin DOM (with gestures).
 * Must call after marker.addTo(map) so getElement() exists — we attach in addRasterHtmlMarker.
 */
export function addRasterHtmlMarker(
  L: typeof import('leaflet'),
  map: LeafletMap,
  el: HTMLDivElement,
  lat: number,
  lng: number,
  opts?: { large?: boolean; kind?: 'listing' | 'profile' | 'cluster' },
): Marker {
  // Listing pills need a wider host so titles aren't clipped to a 72px box
  const kind = opts?.kind ?? (el.dataset.pinType as 'listing' | 'profile' | 'cluster' | undefined);
  const large = !!opts?.large;
  let w = large ? 72 : 48;
  let h = large ? 72 : 52;
  if (kind === 'listing') {
    w = large ? 168 : 140;
    h = large ? 44 : 36;
  } else if (kind === 'cluster') {
    w = large ? 64 : 52;
    h = large ? 64 : 52;
  }
  const icon = L.divIcon({
    html: '<div class="swipess-raster-marker-host"></div>',
    className: 'swipess-raster-marker',
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
  const marker = L.marker([lat, lng], { icon, keyboard: false, riseOnHover: true }).addTo(map);
  const host = marker.getElement()?.querySelector('.swipess-raster-marker-host');
  if (host) {
    host.appendChild(el);
  } else {
    // Fallback: inject into icon root
    const root = marker.getElement();
    if (root) {
      root.innerHTML = '';
      root.appendChild(el);
    }
  }
  return marker;
}
