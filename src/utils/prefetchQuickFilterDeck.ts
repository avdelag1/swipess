import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/state/filterStore';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';
import { normalizeCategoryName } from '@/types/filters';
import { getCardImageUrl, pwaImagePreloader } from '@/utils/imageOptimization';
import { prefetchImage } from '@/utils/performance';
import { shouldPrefetch } from '@/lib/prefetchCoordinator';

const LISTING_PAGE_SIZE = 20;
const HERO_IMAGE_COUNT = 8;
const LISTING_CATEGORIES = new Set([
  'property',
  'motorcycle',
  'bicycle',
  'yacht',
  'services',
  'worker',
]);

const inFlight = new Map<string, Promise<void>>();

function mapUiCategoryToDb(category: string): string {
  if (category === 'services') return 'worker';
  return category;
}

/**
 * Build the same filter object shape `getListingFilters()` produces AFTER
 * `selectDeckCategory(category, listingType)` — so React Query keys match.
 */
export function buildDeckFiltersForCategory(
  category: string,
  listingType: QuickFilterListingType = 'both',
) {
  const state = useFilterStore.getState();
  const uiCategory = category as QuickFilterCategory;
  const dbCat = mapUiCategoryToDb(uiCategory);

  const result: Record<string, unknown> = {
    category: uiCategory,
    categories: [dbCat],
    listingType,
    propertyType: state.propertyTypes.length > 0 ? state.propertyTypes : undefined,
    priceRange: state.priceRange ?? undefined,
    bedrooms: state.bedrooms.length > 0 ? state.bedrooms : undefined,
    bathrooms: state.bathrooms.length > 0 ? state.bathrooms : undefined,
    amenities: state.amenities.length > 0 ? state.amenities : undefined,
    showHireServices: uiCategory === 'services' || undefined,
    clientGender: state.clientGender !== 'any' ? state.clientGender : undefined,
    clientType: state.clientType !== 'all' ? state.clientType : undefined,
    ageRange: state.clientAgeRange ?? undefined,
    budgetRange: state.clientBudgetRange ?? undefined,
    nationalities: state.clientNationalities.length > 0 ? state.clientNationalities : undefined,
    radiusKm: state.radiusKm,
    userLatitude: state.userLatitude ?? undefined,
    userLongitude: state.userLongitude ?? undefined,
    passportMode: state.passportMode,
    petFriendly: state.petFriendly || undefined,
    furnished: state.furnished || undefined,
  };

  if (state.serviceTypes.length > 0) result.serviceTypes = state.serviceTypes;
  if (state.motoTypes.length > 0) result.motoTypes = state.motoTypes;
  if (state.bicycleTypes.length > 0) result.bicycleTypes = state.bicycleTypes;
  if (state.yachtTypes.length > 0) result.yachtTypes = state.yachtTypes;

  return result;
}

function warmListingImages(listings: any[], count = HERO_IMAGE_COUNT) {
  if (!Array.isArray(listings) || listings.length === 0) return;

  const urls: string[] = [];
  for (const item of listings.slice(0, count)) {
    const hero = item?.images?.[0] || item?.image_url;
    if (typeof hero === 'string' && hero.length > 0) {
      const optimized = getCardImageUrl(hero);
      urls.push(optimized);
      prefetchImage(optimized, true);
    }
  }

  if (urls.length > 0) {
    void pwaImagePreloader.batchPreload(urls);
  }
}

async function fetchSmartListings(userId: string, category: string, pageSize: number) {
  const dbCategory = normalizeCategoryName(category) || category;
  const rpcCategory = dbCategory === 'all' ? null : mapUiCategoryToDb(dbCategory);

  try {
    const { data: rpcListings, error } = await (supabase as any).rpc('get_smart_listings', {
      p_user_id: userId,
      p_category: rpcCategory,
      p_limit: pageSize,
      p_offset: 0,
    });

    if (!error && Array.isArray(rpcListings) && rpcListings.length > 0) {
      return (rpcListings as any[]).map((l) => ({
        ...l,
        images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : []),
      }));
    }
  } catch {
    /* fall through */
  }

  let query = supabase
    .from('listings')
    .select('id, title, category, listing_type, images, image_url, price, city, neighborhood, created_at, updated_at, owner_id')
    .neq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (rpcCategory) {
    query = query.eq('category', rpcCategory === 'services' ? 'worker' : rpcCategory);
  }

  const { data } = await query;
  return (data || []).map((l: any) => ({
    ...l,
    images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : []),
  }));
}

/**
 * Prefetch the first page of a quick-filter deck + warm hero photos.
 * Call on pointer/touch intent AND immediately before opening the deck.
 */
export async function prefetchQuickFilterDeck(
  queryClient: QueryClient,
  userId: string | undefined,
  category: string,
  listingType: QuickFilterListingType = 'both',
  options?: { imageCount?: number },
): Promise<void> {
  if (!userId || !category || typeof window === 'undefined') return;

  const normalized = normalizeCategoryName(category) || category;
  if (!LISTING_CATEGORIES.has(normalized) && !LISTING_CATEGORIES.has(category)) {
    return;
  }

  const filters = buildDeckFiltersForCategory(category, listingType);
  const filtersKey = JSON.stringify(filters);
  const dedupeKey = `qf-deck:${userId}:${filtersKey}`;

  if (inFlight.has(dedupeKey)) return inFlight.get(dedupeKey);
  if (!shouldPrefetch(dedupeKey)) return;

  const imageCount = options?.imageCount ?? HERO_IMAGE_COUNT;

  const run = (async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['smart-listings', userId, filtersKey, 0, LISTING_PAGE_SIZE, false],
        queryFn: async () => {
          const listings = await fetchSmartListings(userId, category, LISTING_PAGE_SIZE);
          warmListingImages(listings, imageCount);
          return listings;
        },
        staleTime: 2 * 60 * 1000,
      });

      // If cache was already filled, still warm images from it.
      const cached = queryClient.getQueryData<any[]>([
        'smart-listings',
        userId,
        filtersKey,
        0,
        LISTING_PAGE_SIZE,
        false,
      ]);
      if (cached?.length) warmListingImages(cached, imageCount);
    } catch {
      /* non-blocking */
    } finally {
      inFlight.delete(dedupeKey);
    }
  })();

  inFlight.set(dedupeKey, run);
  return run;
}

/** Idle warm for the most-tapped quick filters so first open is instant. */
export function warmTopQuickFilterDecks(queryClient: QueryClient, userId: string | undefined) {
  if (!userId) return;

  const targets: Array<{ category: string; listingType: QuickFilterListingType }> = [
    { category: 'property', listingType: 'sale' },
    { category: 'property', listingType: 'rent' },
    { category: 'services', listingType: 'both' },
    { category: 'yacht', listingType: 'both' },
    { category: 'motorcycle', listingType: 'both' },
    { category: 'bicycle', listingType: 'both' },
  ];

  targets.forEach((t, i) => {
    window.setTimeout(() => {
      void prefetchQuickFilterDeck(queryClient, userId, t.category, t.listingType, {
        imageCount: i < 2 ? 10 : 5,
      });
    }, 180 + i * 220);
  });
}

/** Map bento card id → deck category + listing type used by SwipessSwipeContainer. */
export function resolveQuickFilterDeckTarget(id: string): {
  category: string;
  listingType: QuickFilterListingType;
} | null {
  if (id === 'recommended' || id === 'popular' || id === 'property') {
    return { category: 'property', listingType: 'sale' };
  }
  if (id === 'rentals') {
    return { category: 'property', listingType: 'rent' };
  }
  if (id === 'pros' || id === 'services') {
    return { category: 'services', listingType: 'both' };
  }
  if (id === 'yacht' || id === 'motorcycle' || id === 'bicycle') {
    return { category: id, listingType: 'both' };
  }
  return null;
}
