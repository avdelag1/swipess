import { EVENT_CATEGORY_IMAGES } from '@/data/eventsData';
import { pwaImagePreloader } from '@/utils/imageOptimization';

let batchStarted = false;

/** All category ring photo URLs for the events feed header. */
export function getEventCategoryPhotoUrls(): string[] {
  return [...new Set(EVENT_CATEGORY_IMAGES)];
}

/** Idle prefetch — call on app warm / dashboard. */
export function prefetchEventCategoryPhotos(): void {
  if (batchStarted || typeof window === 'undefined') return;
  batchStarted = true;
  void pwaImagePreloader.batchPreload(getEventCategoryPhotoUrls());
}

/** Immediate prefetch — call before opening the events feed. */
export function prefetchEventCategoryPhotosImmediate(): void {
  if (typeof window === 'undefined') return;
  void pwaImagePreloader.batchPreload(getEventCategoryPhotoUrls());
}