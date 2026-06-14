export interface GeoItem {
  latitude?: number | null;
  longitude?: number | null;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterByDistance<T extends GeoItem>(
  items: T[],
  userLat: number,
  userLon: number,
  radiusKm: number,
  includeWithoutCoords = true,
): T[] {
  return items.filter((item) => {
    const lat = item.latitude;
    const lng = item.longitude;
    if (lat == null || lng == null) return includeWithoutCoords;
    return haversineKm(userLat, userLon, lat, lng) <= radiusKm;
  });
}

export interface LocationFilterInput {
  userLatitude?: number | null;
  userLongitude?: number | null;
  radiusKm?: number;
}

export function hasActiveLocationFilter(filters?: LocationFilterInput | null): boolean {
  return filters?.userLatitude != null && filters?.userLongitude != null;
}