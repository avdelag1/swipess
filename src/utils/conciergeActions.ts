import { useFilterStore } from '@/state/filterStore';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import { type PassportAction, resolvePassportLocation } from '@/utils/passportLocation';
import type { QuickFilterCategory } from '@/types/filters';

/** Apply a Global Passport teleport from AI chat or UI. */
export async function applyPassportAction(action: PassportAction): Promise<{ ok: boolean; label?: string; error?: string }> {
  const store = useFilterStore.getState();

  if (action.useGPS) {
    if (!canGeolocate()) {
      return { ok: false, error: 'Location not available on this device' };
    }
    try {
      const { latitude, longitude } = await getCurrentPosition({ timeout: 10000 });
      store.setUserLocation(latitude, longitude);
      store.setRadiusKm(action.radiusKm ?? 50);
      return { ok: true, label: 'your current location' };
    } catch {
      return { ok: false, error: 'Could not detect GPS location' };
    }
  }

  const resolved = await resolvePassportLocation(action);
  if (!resolved) {
    return { ok: false, error: `Could not find "${action.city || action.country || 'that location'}"` };
  }

  store.setPassportLocation(resolved.lat, resolved.lng, resolved.label);
  store.setRadiusKm(action.radiusKm ?? 50);
  return { ok: true, label: resolved.label };
}

/** Apply AI [FILTER:...] tags to the swipe deck (categories + optional passport). */
export async function applyConciergeFilters(filters: Record<string, unknown>): Promise<{ passportLabel?: string }> {
  const store = useFilterStore.getState();

  if (filters.activeCategory) {
    store.setActiveCategory(filters.activeCategory as QuickFilterCategory);
  }
  if (filters.listingType) {
    store.setListingType(filters.listingType as 'rent' | 'buy' | 'both');
  }
  if (filters.clientGender) {
    store.setClientGender(filters.clientGender as any);
  }
  if (filters.clientType) {
    store.setClientType(filters.clientType as any);
  }
  if (Array.isArray(filters.priceRange)) {
    store.setPriceRange(filters.priceRange as [number, number]);
  }
  if (typeof filters.radiusKm === 'number') {
    store.setRadiusKm(filters.radiusKm);
  }

  const hasPassport = filters.passportCity || filters.passportCountry
    || (typeof filters.userLatitude === 'number' && typeof filters.userLongitude === 'number');

  if (hasPassport) {
    const result = await applyPassportAction({
      city: filters.passportCity as string | undefined,
      country: filters.passportCountry as string | undefined,
      lat: filters.userLatitude as number | undefined,
      lng: filters.userLongitude as number | undefined,
      radiusKm: filters.radiusKm as number | undefined,
    });
    if (result.ok) return { passportLabel: result.label };
  }

  return {};
}