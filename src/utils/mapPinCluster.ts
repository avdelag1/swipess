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

const indexCache = new WeakMap<object, Supercluster<PinProps>>();

function buildIndex(pins: ClusterablePin[]): Supercluster<PinProps> {
  const index = new Supercluster<PinProps>({
    radius: 56,
    maxZoom: 16,
    minZoom: 0,
    minPoints: 2,
  });

  const features: Supercluster.PointFeature<PinProps>[] = pins
    .filter((p) => Number.isFinite(p.data.lat) && Number.isFinite(p.data.lng))
    .map((p) => ({
      type: 'Feature' as const,
      properties: {
        kind: p.kind,
        id: p.data.id,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [p.data.lng, p.data.lat],
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
    return pins.map((pin) => ({
      type: 'leaf' as const,
      key: `${pin.kind}:${pin.data.id}`,
      lat: pin.data.lat,
      lng: pin.data.lng,
      pin,
    }));
  }

  const index = ensureIndex(pins);
  const z = Math.max(0, Math.min(16, Math.floor(zoom)));
  const clusters = index.getClusters(bbox, z);
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
        16,
        index.getClusterExpansionZoom(props.cluster_id),
      );
      // Sample leaves for dominant color (cheap)
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

  return items;
}

/** World bbox when map bounds unavailable */
export const WORLD_BBOX: [number, number, number, number] = [-180, -85, 180, 85];

export function bboxFromMapboxMap(map: {
  getBounds: () => { getWest: () => number; getSouth: () => number; getEast: () => number; getNorth: () => number };
}): [number, number, number, number] {
  try {
    const b = map.getBounds();
    // Pad slightly so edge pins don't pop in/out
    const w = b.getWest();
    const s = b.getSouth();
    const e = b.getEast();
    const n = b.getNorth();
    const padX = (e - w) * 0.08;
    const padY = (n - s) * 0.08;
    return [w - padX, s - padY, e + padX, n + padY];
  } catch {
    return WORLD_BBOX;
  }
}

export function bboxFromLeafletMap(map: {
  getBounds: () => { getWest: () => number; getSouth: () => number; getEast: () => number; getNorth: () => number };
}): [number, number, number, number] {
  return bboxFromMapboxMap(map);
}
