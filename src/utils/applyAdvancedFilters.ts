import { useFilterStore } from '@/state/filterStore';
import type { QuickFilterCategory } from '@/types/filters';

type CategoryKey = 'property' | 'motorcycle' | 'bicycle' | 'services';

const CATEGORY_MAP: Record<CategoryKey, QuickFilterCategory> = {
  property: 'property',
  motorcycle: 'motorcycle',
  bicycle: 'bicycle',
  services: 'services',
};

/** Normalize a single category filter blob from AdvancedFiltersDialog into store fields. */
function mergeCategoryBlob(
  blob: Record<string, unknown>,
  category: CategoryKey,
  userRole: 'client' | 'owner' | 'admin',
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (Array.isArray(blob.property_types) && blob.property_types.length) {
    out.propertyTypes = blob.property_types;
  }
  if (Array.isArray(blob.moto_types) && blob.moto_types.length) {
    out.motoTypes = blob.moto_types;
  }
  if (Array.isArray(blob.bicycle_types) && blob.bicycle_types.length) {
    out.bicycleTypes = blob.bicycle_types;
  }
  if (Array.isArray(blob.service_categories) && blob.service_categories.length) {
    out.serviceTypes = blob.service_categories;
  }
  if (Array.isArray(blob.service_types) && blob.service_types.length) {
    out.serviceTypes = blob.service_types;
  }

  const listingTypes = blob.listing_types as string[] | undefined;
  const interestType = blob.interest_type as string | undefined;
  const intent = listingTypes?.[0] || interestType;
  if (intent && intent !== 'both') {
    out.listingType = intent;
  }

  const priceMin = blob.price_min ?? blob.budget_min;
  const priceMax = blob.price_max ?? blob.budget_max;
  if (priceMin != null || priceMax != null) {
    out.priceRange = [Number(priceMin ?? 0), Number(priceMax ?? 1_000_000)];
  }

  const minBeds = blob.min_bedrooms ?? blob.bedrooms_min;
  const maxBeds = blob.max_bedrooms;
  if (minBeds != null || maxBeds != null) {
    out.bedrooms = [Number(minBeds ?? 0), Number(maxBeds ?? minBeds ?? 10)];
  }

  const minBaths = blob.min_bathrooms ?? blob.bathrooms_min;
  const maxBaths = blob.max_bathrooms;
  if (minBaths != null || maxBaths != null) {
    out.bathrooms = [Number(minBaths ?? 0), Number(maxBaths ?? minBaths ?? 5)];
  }

  if (blob.furnished === true) out.furnished = true;
  if (blob.pet_friendly === true) out.petFriendly = true;

  if (typeof blob.radius_km === 'number') {
    out.radiusKm = blob.radius_km;
  }

  if (userRole === 'owner') {
    const gender = blob.gender_preference as string | undefined;
    if (gender && gender !== 'any') {
      out.clientGender = gender;
    }
    if (typeof blob.age_min === 'number' && typeof blob.age_max === 'number') {
      out.clientAgeRange = [blob.age_min, blob.age_max];
    }
    if (priceMin != null || priceMax != null) {
      out.clientBudgetRange = [Number(priceMin ?? 0), Number(priceMax ?? 1_000_000)];
    }
    if (Array.isArray(blob.nationalities) && blob.nationalities.length) {
      out.clientNationalities = blob.nationalities;
    }
  }

  return out;
}

/** Apply AdvancedFiltersDialog output to the centralized filter store. */
export function applyAdvancedFiltersToStore(
  allFilters: Record<string, unknown>,
  userRole: 'client' | 'owner' | 'admin',
): void {
  const store = useFilterStore.getState();
  const merged: Record<string, unknown> = {};

  const activeCat = allFilters.activeCategory as CategoryKey | undefined;
  if (activeCat && CATEGORY_MAP[activeCat]) {
    merged.activeCategory = CATEGORY_MAP[activeCat];
    merged.categories = [CATEGORY_MAP[activeCat]];
  }

  const categoryFilters = allFilters.categoryFilters as Record<CategoryKey, Record<string, unknown>> | undefined;
  if (categoryFilters) {
    for (const [cat, blob] of Object.entries(categoryFilters)) {
      if (!blob || Object.keys(blob).length === 0) continue;
      Object.assign(merged, mergeCategoryBlob(blob, cat as CategoryKey, userRole));
    }
  }

  // Prefixed keys from handleApply (e.g. property_price_min)
  for (const [key, value] of Object.entries(allFilters)) {
    if (key === 'activeCategory' || key === 'categoryFilters' || key === 'filterCounts') continue;
    const match = key.match(/^(property|motorcycle|bicycle|services)_(.+)$/);
    if (!match) continue;
    const [, cat, field] = match;
    const blob = { [field]: value };
    Object.assign(merged, mergeCategoryBlob(blob, cat as CategoryKey, userRole));
  }

  store.setFilters({
    ...(merged as Parameters<typeof store.setFilters>[0]),
    ...(merged.clientAgeRange !== undefined && { clientAgeRange: merged.clientAgeRange as [number, number] | null }),
    ...(merged.clientBudgetRange !== undefined && { clientBudgetRange: merged.clientBudgetRange as [number, number] | null }),
    ...(merged.clientNationalities !== undefined && { clientNationalities: merged.clientNationalities as string[] }),
  });
}