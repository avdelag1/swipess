/**
 * Supercluster-backed pin clustering for Passport map (Mapbox + Leaflet HTML markers).
 * Zoomed out → numbered clusters; zoomed in → individual clickable pins.
 */

import Supercluster from 'supercluster';
import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';

export type ClusterablePin =
  | { kind: 'listing'; data: MapListingPin }
  | { kind: 'profile'; data: MapProfilePin };

type PinProps = {
  kind: 'listing' | 'profile';
  id: string;
};

export type ClusterLeaf = {
  type: 'leaf';
  key: string;
  lat: number;
  lng: number;
  pin: ClusterablePin;
};

export type ClusterGroup = {
  type: 'cluster';
  key: string;
  lat: number;
  lng: number;
  count: number;
  clusterId: number;
  expansionZoom: number;
  /** Dominant kind for color (more profiles vs listings) */
  dominant: 'listing' | 'profile' | 'mixed';
};

export type ClusterItem = ClusterLeaf | ClusterGroup;

/** Clusters stop being generated above this zoom — leaves always show when zoomed in. */
const CLUSTER_MAX_ZOOM = 14;

function buildIndex(pins: ClusterablePin[]): Supercluster<PinProps> {
  const index = new Supercluster<PinProps>({
    // Pixel radius at each zoom — groups nearby pins when zoomed out
    radius: 60,
    maxZoom: CLUSTER_MAX_ZOOM,
    minZoom: 0,
    minPoints: 2,
  });

  const features = pins
    .filter((p) => Number.isFinite(p.data.lat) && Number.isFinite(p.data.lng))
    .map((p) => ({
      type: 'Feature' as const,
      properties: {
        kind: p.kind,
        id: p.data.id,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [p.data.lng, p.data.lat] as [number, number],
      },
    }));

  index.load(features);
  return index;
}

/** Stable key for pin list so we rebuild Supercluster only when data changes. */
export function pinListIdentity(pins: ClusterablePin[]): string {
  if (pins.length === 0) return '0';
  // id+rounded coord — enough to detect moves without full JSON
  return `${pins.length}:${pins.map((p) => `${p.kind[0]}${p.data.id}:${p.data.lat.toFixed(4)},${p.data.lng.toFixed(4)}`).join('|')}`;
}

let lastIdentity = '';
let lastIndex: Supercluster<PinProps> | null = null;
let lastPinByKey = new Map<string, ClusterablePin>();

function ensureIndex(pins: ClusterablePin[]): Supercluster<PinProps> {
  const id = pinListIdentity(pins);
  if (lastIndex && id === lastIdentity) return lastIndex;
  lastIdentity = id;
  lastIndex = buildIndex(pins);
  lastPinByKey = new Map(pins.map((p) => [`${p.kind}:${p.data.id}`, p]));
  return lastIndex;
}

function pinsAsLeaves(pins: ClusterablePin[]): ClusterLeaf[] {
  return pins
    .filter((p) => Number.isFinite(p.data.lat) && Number.isFinite(p.data.lng))
    .map((pin) => ({
      type: 'leaf' as const,
      key: `${pin.kind}:${pin.data.id}`,
      lat: pin.data.lat,
      lng: pin.data.lng,
      pin,
    }));
}

/**
 * Get clusters / leaves for the current viewport + zoom.
 * bbox: [west, south, east, north]
 */
export function getClusterItems(
  pins: ClusterablePin[],
  bbox: [number, number, number, number],
  zoom: number,
): ClusterItem[] {
  if (pins.length === 0) return [];

  // Very few pins — no clustering overhead
  if (pins.length < 2) {
    return pinsAsLeaves(pins);
  }

  // Supercluster: zoom > maxZoom returns unclustered leaves.
  // Must NOT clamp to maxZoom or same-spot stacks never break apart.
  const z = Math.max(0, Math.min(CLUSTER_MAX_ZOOM + 1, Math.floor(zoom)));
  const safeBbox = isUsableBbox(bbox) ? bbox : WORLD_BBOX;

  try {
    const index = ensureIndex(pins);
    const clusters = index.getClusters(safeBbox, z);
    const items: ClusterItem[] = [];

    for (const f of clusters) {
      const [lng, lat] = f.geometry.coordinates;
      const props = f.properties as PinProps & {
        cluster?: boolean;
        cluster_id?: number;
        point_count?: number;
      };

      if (props.cluster && props.cluster_id != null) {
        const count = props.point_count ?? 0;
        const expansionZoom = Math.min(
          18,
          Math.max(z + 1, index.getClusterExpansionZoom(props.cluster_id)),
        );
        let listingN = 0;
        let profileN = 0;
        try {
          const leaves = index.getLeaves(props.cluster_id, 24, 0);
          for (const leaf of leaves) {
            if (leaf.properties.kind === 'listing') listingN += 1;
            else profileN += 1;
          }
        } catch {
          /* empty */
        }
        const dominant: ClusterGroup['dominant'] =
          listingN > 0 && profileN > 0
            ? 'mixed'
            : profileN >= listingN
              ? 'profile'
              : 'listing';

        items.push({
          type: 'cluster',
          key: `cluster:${props.cluster_id}`,
          lat,
          lng,
          count,
          clusterId: props.cluster_id,
          expansionZoom,
          dominant,
        });
      } else {
        const key = `${props.kind}:${props.id}`;
        const pin = lastPinByKey.get(key);
        if (!pin) continue;
        items.push({
          type: 'leaf',
          key,
          lat,
          lng,
          pin,
        });
      }
    }

    // CRITICAL: never wipe the map if Supercluster returned nothing for a
    // degenerate/wrong bbox while we still have pin data (Safari Leaflet).
    if (items.length === 0 && pins.length > 0) {
      return pinsAsLeaves(pins);
    }

    return items;
  } catch {
    return pinsAsLeaves(pins);
  }
}

/** World bbox when map bounds unavailable */
export const WORLD_BBOX: [number, number, number, number] = [-180, -85, 180, 85];

function isUsableBbox(bbox: [number, number, number, number]): boolean {
  const [w, s, e, n] = bbox;
  if (![w, s, e, n].every(Number.isFinite)) return false;
  // Degenerate / zero-area bounds (Leaflet before invalidateSize) → empty clusters
  if (e - w < 1e-6 || n - s < 1e-6) return false;
  if (e < w || n < s) return false;
  return true;
}

/** Accept Mapbox or Leaflet maps — both expose getBounds() with west/south/east/north. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bboxFromMapboxMap(map: { getBounds: () => any }): [number, number, number, number] {
  try {
    const b = map.getBounds();
    const w = typeof b.getWest === 'function' ? b.getWest() : b._southWest?.lng;
    const s = typeof b.getSouth === 'function' ? b.getSouth() : b._southWest?.lat;
    const e = typeof b.getEast === 'function' ? b.getEast() : b._northEast?.lng;
    const n = typeof b.getNorth === 'function' ? b.getNorth() : b._northEast?.lat;
    if (![w, s, e, n].every((v: unknown) => typeof v === 'number' && Number.isFinite(v))) {
      return WORLD_BBOX;
    }
    // Minimum pad so a near-point bounds still includes nearby pins
    const spanX = Math.max(e - w, 0.02);
    const spanY = Math.max(n - s, 0.02);
    const padX = spanX * 0.12;
    const padY = spanY * 0.12;
    const bbox: [number, number, number, number] = [
      w - padX,
      s - padY,
      e + padX,
      n + padY,
    ];
    return isUsableBbox(bbox) ? bbox : WORLD_BBOX;
  } catch {
    return WORLD_BBOX;
  }
}

export function bboxFromLeafletMap(map: { getBounds: () => unknown }): [number, number, number, number] {
  return bboxFromMapboxMap(map as { getBounds: () => unknown });
}
