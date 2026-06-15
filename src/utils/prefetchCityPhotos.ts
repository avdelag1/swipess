import { DEFAULT_CITY_PHOTO, PASSPORT_QUICK_CITIES } from '@/data/cityPhotos';
import { pwaImagePreloader } from '@/utils/imageOptimization';

let batchStarted = false;

/** All curated city cover URLs used in passport sheets and map city chips. */
export function getPassportCityPhotoUrls(): string[] {
  const urls = new Set<string>([DEFAULT_CITY_PHOTO]);
  for (const city of PASSPORT_QUICK_CITIES) {
    if (city.img) urls.add(city.img);
  }
  return [...urls];
}

/** Pre-decode city photos once per session (idle-friendly). */
export function prefetchCityPhotos(): void {
  if (batchStarted || typeof window === 'undefined') return;
  batchStarted = true;
  void pwaImagePreloader.batchPreload(getPassportCityPhotoUrls());
}

/** Pre-decode city photos immediately — call before opening passport/map UI. */
export function prefetchCityPhotosImmediate(): void {
  if (typeof window === 'undefined') return;
  void pwaImagePreloader.batchPreload(getPassportCityPhotoUrls());
}