import type { Listing } from '@/hooks/useListings';
import type { ClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import type { ListingFilters } from '@/types/filters';
import { calculateClientMatch, calculateListingMatch } from '@/hooks/smartMatching/matchCalculators';
import type { MatchedClientProfile } from '@/hooks/smartMatching/types';
import { filterClientTypeToDb, resolveClientType } from '@/utils/clientType';

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

/**
 * Location filter for listings: never drop real rows missing lat/lng (common in DB).
 * Passport mode prioritizes in-radius; device GPS shows nearby first, then the rest.
 */
export function applyListingLocationFilter<T extends GeoItem>(
  items: T[],
  filters?: (LocationFilterInput & { passportMode?: boolean }) | null,
): T[] {
  if (!hasActiveLocationFilter(filters)) return items;

  const userLat = filters!.userLatitude!;
  const userLon = filters!.userLongitude!;
  const radiusKm = filters?.radiusKm ?? 50;

  const withCoords: T[] = [];
  const withoutCoords: T[] = [];
  for (const item of items) {
    if (item.latitude != null && item.longitude != null) withCoords.push(item);
    else withoutCoords.push(item);
  }

  const inRadius = filterByDistance(withCoords, userLat, userLon, radiusKm, false);
  const inRadiusSet = new Set(inRadius);
  const outRadius = withCoords.filter((item) => !inRadiusSet.has(item));

  if (filters?.passportMode) {
    return [...inRadius, ...withoutCoords];
  }

  return [...inRadius, ...withoutCoords, ...outRadius];
}

export type EventGeoItem = GeoItem & {
  visibility_radius_km?: number | null;
};

/**
 * Events: hard nearby-only when the viewer has a location.
 * - Uses min(viewer radiusKm, event.visibility_radius_km) when the event sets a cap.
 * - If nothing in the feed has lat/lng yet (pre-migration / not backfilled), keep the
 *   list intact so we don't blank the UI.
 * - Once any events are geocoded, rows without coords are hidden (no worldwide leak).
 */
export function applyEventLocationFilter<T extends EventGeoItem>(
  items: T[],
  filters?: LocationFilterInput | null,
): T[] {
  if (!hasActiveLocationFilter(filters)) return items;

  const userLat = filters!.userLatitude!;
  const userLon = filters!.userLongitude!;
  const viewerRadius = filters?.radiusKm ?? 50;

  const withCoords = items.filter((item) => item.latitude != null && item.longitude != null);
  if (withCoords.length === 0) return items;

  return withCoords.filter((item) => {
    const eventCap =
      item.visibility_radius_km != null && Number.isFinite(item.visibility_radius_km)
        ? Number(item.visibility_radius_km)
        : null;
    const maxKm = eventCap != null ? Math.min(viewerRadius, eventCap) : viewerRadius;
    return haversineKm(userLat, userLon, item.latitude!, item.longitude!) <= maxKm;
  });
}

export function hasActiveAdvancedListingFilters(filters?: ListingFilters | null): boolean {
  if (!filters) return false;
  return !!(
    (filters.listingType && filters.listingType !== 'both')
    || filters.priceRange
    || (filters.bedrooms && filters.bedrooms.length > 0)
    || (filters.bathrooms && filters.bathrooms.length > 0)
    || (filters.amenities && filters.amenities.length > 0)
    || (filters.propertyType && filters.propertyType.length > 0)
    || (filters.serviceCategory && filters.serviceCategory.length > 0)
    || (filters.motoTypes && filters.motoTypes.length > 0)
    || (filters.bicycleTypes && filters.bicycleTypes.length > 0)
    || filters.petFriendly
    || filters.furnished
  );
}

export function listingFiltersToPreferences(filters: ListingFilters): ClientFilterPreferences {
  const category = filters.category || filters.categories?.[0];
  const normalized = typeof category === 'string' ? category.replace(/s$/, '') : category;

  const prefs: ClientFilterPreferences = {
    user_id: '',
    preferred_listing_types: filters.listingType && filters.listingType !== 'both'
      ? [filters.listingType]
      : undefined,
    price_min: filters.priceRange?.[0],
    price_max: filters.priceRange?.[1],
    min_bedrooms: filters.bedrooms?.[0],
    max_bedrooms: filters.bedrooms?.[1] ?? filters.bedrooms?.[0],
    min_bathrooms: filters.bathrooms?.[0],
    max_bathrooms: filters.bathrooms?.[1] ?? filters.bathrooms?.[0],
    property_types: filters.propertyType,
    amenities_required: filters.amenities,
    moto_types: filters.motoTypes,
    bicycle_types: filters.bicycleTypes,
    pet_friendly_required: filters.petFriendly || undefined,
    furnished_required: filters.furnished || undefined,
    interested_in_properties: normalized === 'property' || undefined,
    interested_in_motorcycles: normalized === 'motorcycle' || undefined,
    interested_in_bicycles: normalized === 'bicycle' || undefined,
  };

  if (filters.serviceCategory?.length) {
    (prefs as Record<string, unknown>).service_categories = filters.serviceCategory;
  }

  return prefs;
}

/** Hard-exclude listings that fail active advanced filters (RPC fast path). */
export function filterListingsByAdvancedFilters<T extends Listing>(
  listings: T[],
  filters?: ListingFilters | null,
): T[] {
  if (!hasActiveAdvancedListingFilters(filters)) return listings;
  const prefs = listingFiltersToPreferences(filters!);
  return listings.filter((listing) => {
    const match = calculateListingMatch(prefs, listing);
    return match.percentage > 0;
  });
}

export function hasActiveOwnerClientFilters(filters?: ListingFilters | null): boolean {
  if (!filters) return false;
  return !!(
    (filters.clientGender && filters.clientGender !== 'any')
    || (filters.clientType && filters.clientType !== 'all')
    || filters.budgetRange
    || filters.ageRange
    || (filters.nationalities && filters.nationalities.length > 0)
  );
}

/** Apply owner demographic filters on RPC client results. */
export function filterClientsByOwnerFilters<T extends MatchedClientProfile>(
  clients: T[],
  filters?: ListingFilters | null,
): T[] {
  if (!hasActiveOwnerClientFilters(filters)) return clients;

  const ownerPrefs: Record<string, unknown> = {};
  if (filters?.budgetRange) {
    ownerPrefs.min_budget = filters.budgetRange[0];
    ownerPrefs.max_budget = filters.budgetRange[1];
  }
  if (filters?.ageRange) {
    ownerPrefs.min_age = filters.ageRange[0];
    ownerPrefs.max_age = filters.ageRange[1];
  }
  if (filters?.nationalities?.length) {
    ownerPrefs.preferred_nationalities = filters.nationalities;
  }

  return clients.filter((client) => {
    if (filters?.clientGender && filters.clientGender !== 'any') {
      const g = (client.gender || '').toLowerCase();
      if (g && g !== filters.clientGender.toLowerCase()) return false;
    }
    if (filters?.clientType && filters.clientType !== 'all') {
      const expected = filterClientTypeToDb(filters.clientType);
      if (expected) {
        const actual = resolveClientType({
          client_type: (client as Record<string, unknown>).client_type as string | null,
          intentions: (client as Record<string, unknown>).intentions,
          occupation: client.occupation,
        });
        if (actual !== expected) return false;
      }
    }
    if (filters?.ageRange && client.age) {
      if (client.age < filters.ageRange[0] || client.age > filters.ageRange[1]) return false;
    }
    if (hasActiveOwnerClientFilters(filters)) {
      const match = calculateClientMatch(ownerPrefs, client);
      if (match.percentage === 0 && match.incompatible.length > 0) return false;
    }
    return true;
  });
}