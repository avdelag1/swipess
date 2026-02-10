/**
 * Liked Images Cache
 *
 * Aggressive caching for liked property images.
 * When a property is liked, we preload and cache all its images
 * so they're instantly available when viewing liked properties.
 *
 * This solves the "slow carousel" problem - images should already
 * be loaded since the user explicitly saved this property.
 */

import { getThumbnailUrl, getFullImageUrl, getCardImageUrl } from './imageOptimization';

interface CachedImage {
  url: string;
  thumbnailUrl: string;
  fullUrl: string;
  element: HTMLImageElement | null;
  thumbnailElement: HTMLImageElement | null;
  status: 'pending' | 'loading' | 'ready' | 'failed';
  decodedAt: number | null;
}

interface CachedListing {
  id: string;
  images: CachedImage[];
  cachedAt: number;
}

class LikedImagesCache {
  private cache = new Map<string, CachedListing>();
  private maxListings = 50; // Cache up to 50 liked listings
  private preloadQueue: Array<{ listingId: string; images: string[] }> = [];
  private isProcessing = false;

  /**
   * Preload all images for a liked listing
   * Call this when a user likes a property
   */
  async preloadListing(listingId: string, images: string[]): Promise<void> {
    if (!images || images.length === 0) return;

    // Already cached
    if (this.cache.has(listingId)) {
      return;
    }

    // Initialize cache entry
    const cachedImages: CachedImage[] = images.map(url => ({
      url,
      thumbnailUrl: getThumbnailUrl(url),
      fullUrl: getFullImageUrl(url),
      element: null,
      thumbnailElement: null,
      status: 'pending',
      decodedAt: null,
    }));

    this.cache.set(listingId, {
      id: listingId,
      images: cachedImages,
      cachedAt: Date.now(),
    });

    // Evict old entries if cache is full
    this.evictOldEntries();

    // Queue for background preloading
    this.preloadQueue.push({ listingId, images });
    this.processQueue();
  }

  /**
   * Process preload queue in background
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) return;

    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      const item = this.preloadQueue.shift();
      if (!item) break;

      const entry = this.cache.get(item.listingId);
      if (!entry) continue;

      // Preload all images for this listing
      await Promise.all(
        entry.images.map(async (img, idx) => {
          // Preload thumbnail first (priority)
          await this.loadImage(img, 'thumbnail', idx === 0);
          // Then preload full size in background
          this.loadImage(img, 'full', false);
        })
      );
    }

    this.isProcessing = false;
  }

  /**
   * Load and decode a single image
   */
  private async loadImage(
    cachedImage: CachedImage,
    type: 'thumbnail' | 'full',
    highPriority: boolean
  ): Promise<void> {
    const url = type === 'thumbnail' ? cachedImage.thumbnailUrl : cachedImage.fullUrl;

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      if (highPriority) {
        (img as any).fetchPriority = 'high';
      }

      img.onload = async () => {
        try {
          // Force GPU decode
          if ('decode' in img) {
            await img.decode();
          }

          if (type === 'thumbnail') {
            cachedImage.thumbnailElement = img;
          } else {
            cachedImage.element = img;
            cachedImage.status = 'ready';
            cachedImage.decodedAt = Date.now();
          }
        } catch {
          // Decode failed but image is still usable
          if (type === 'full') {
            cachedImage.status = 'ready';
          }
        }
        resolve();
      };

      img.onerror = () => {
        if (type === 'full') {
          cachedImage.status = 'failed';
        }
        resolve();
      };

      img.src = url;
    });
  }

  /**
   * Get cached images for a listing
   */
  getListingImages(listingId: string): CachedImage[] | null {
    const entry = this.cache.get(listingId);
    return entry?.images || null;
  }

  /**
   * Check if listing images are cached
   */
  hasListing(listingId: string): boolean {
    return this.cache.has(listingId);
  }

  /**
   * Check if a specific image is ready
   */
  isImageReady(listingId: string, imageIndex: number): boolean {
    const entry = this.cache.get(listingId);
    if (!entry || imageIndex >= entry.images.length) return false;
    return entry.images[imageIndex].status === 'ready';
  }

  /**
   * Get the preloaded image element for instant display
   */
  getImageElement(listingId: string, imageIndex: number): HTMLImageElement | null {
    const entry = this.cache.get(listingId);
    if (!entry || imageIndex >= entry.images.length) return null;
    return entry.images[imageIndex].element;
  }

  /**
   * Preload images for multiple listings at once
   * Call this when liked properties are fetched
   */
  async preloadBatch(listings: Array<{ id: string; images?: string[] }>): Promise<void> {
    // Filter out already cached
    const toCache = listings.filter(l => !this.cache.has(l.id) && l.images?.length);

    if (toCache.length === 0) return;

    // Preload first 2 images of each listing immediately (hero + next)
    const priorityLoads: Promise<void>[] = [];

    toCache.forEach(listing => {
      if (!listing.images) return;

      const firstTwo = listing.images.slice(0, 2);
      firstTwo.forEach((url, idx) => {
        priorityLoads.push(
          this.preloadSingleImage(url, idx === 0)
        );
      });

      // Queue remaining for background
      this.preloadListing(listing.id, listing.images);
    });

    // Wait for priority loads
    await Promise.allSettled(priorityLoads);
  }

  /**
   * Preload a single image immediately
   */
  private preloadSingleImage(url: string, highPriority: boolean): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      if (highPriority) {
        (img as any).fetchPriority = 'high';
      }

      img.onload = async () => {
        if ('decode' in img) {
          try {
            await img.decode();
          } catch {
            // Ignore decode errors
          }
        }
        resolve();
      };

      img.onerror = () => resolve();
      img.src = getCardImageUrl(url);
    });
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldEntries(): void {
    if (this.cache.size <= this.maxListings) return;

    // Sort by cachedAt and remove oldest
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

    const toRemove = entries.slice(0, this.cache.size - this.maxListings);
    toRemove.forEach(([id]) => this.cache.delete(id));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.preloadQueue = [];
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; queueLength: number } {
    return {
      size: this.cache.size,
      queueLength: this.preloadQueue.length,
    };
  }
}

// Global singleton instance
export const likedImagesCache = new LikedImagesCache();

/**
 * Hook helper: Preload images when listing is liked
 */
export function cacheOnLike(listingId: string, images: string[]): void {
  // Use requestIdleCallback to not block the main thread
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      likedImagesCache.preloadListing(listingId, images);
    });
  } else {
    setTimeout(() => {
      likedImagesCache.preloadListing(listingId, images);
    }, 0);
  }
}

/**
 * Preload all thumbnails for gallery - call when opening gallery
 */
export async function preloadGalleryThumbnails(images: string[]): Promise<void> {
  if (!images || images.length === 0) return;

  const loads = images.map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      (img as any).fetchPriority = 'high';
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = getThumbnailUrl(url);
    });
  });

  await Promise.all(loads);
}

/**
 * Preload full-size images for gallery - call when gallery opens
 */
export async function preloadGalleryFullImages(images: string[]): Promise<void> {
  if (!images || images.length === 0) return;

  // Preload all in parallel with high priority
  const loads = images.map((url, idx) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      // First 3 images get high priority
      if (idx < 3) {
        (img as any).fetchPriority = 'high';
      }
      img.onload = async () => {
        if ('decode' in img) {
          try {
            await img.decode();
          } catch {
            // Ignore
          }
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = getFullImageUrl(url);
    });
  });

  await Promise.all(loads);
}
