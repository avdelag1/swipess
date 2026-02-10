/**
 * SWIPE IMAGE CACHE
 *
 * Global LRU image cache shared across all swipe cards.
 * Prevents re-loading images during swipe sessions and enables
 * instant card display when images are pre-decoded.
 */

import { getCardImageUrl } from '@/utils/imageOptimization';

// LRU cache with max size to prevent memory leaks
const MAX_CACHE_SIZE = 50;
const globalSwipeImageCache = new Map<string, {
  loaded: boolean;
  decoded: boolean;
  failed: boolean;
  lastAccessed: number;
}>();

/**
 * Evict least recently used image from cache when size exceeds limit
 */
function evictLRUFromCache() {
  if (globalSwipeImageCache.size <= MAX_CACHE_SIZE) return;

  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  globalSwipeImageCache.forEach((value, key) => {
    if (value.lastAccessed < oldestTime) {
      oldestTime = value.lastAccessed;
      oldestKey = key;
    }
  });

  if (oldestKey) {
    globalSwipeImageCache.delete(oldestKey);
  }
}

/**
 * Check if an image is already decoded in the global cache
 */
export function isImageDecodedInCache(rawUrl: string): boolean {
  const optimizedUrl = getCardImageUrl(rawUrl);
  const cached = globalSwipeImageCache.get(optimizedUrl);

  // Update LRU timestamp on access
  if (cached) {
    cached.lastAccessed = Date.now();
  }

  return cached?.decoded === true && !cached?.failed;
}

/**
 * Preload an image into the global cache with async decoding
 * Returns a promise that resolves when image is decoded (or fails)
 */
export function preloadImageToCache(rawUrl: string): Promise<boolean> {
  const optimizedUrl = getCardImageUrl(rawUrl);

  const cached = globalSwipeImageCache.get(optimizedUrl);
  if (cached?.decoded) {
    cached.lastAccessed = Date.now(); // Update LRU timestamp
    return Promise.resolve(true);
  }
  if (cached?.failed) return Promise.resolve(false);

  // Evict old entries before adding new one
  evictLRUFromCache();

  return new Promise((resolve) => {
    const img = new Image();
    (img as any).fetchPriority = 'high';
    img.decoding = 'async';

    img.onload = () => {
      globalSwipeImageCache.set(optimizedUrl, { loaded: true, decoded: false, failed: false, lastAccessed: Date.now() });
      if ('decode' in img) {
        img.decode()
          .then(() => {
            globalSwipeImageCache.set(optimizedUrl, { loaded: true, decoded: true, failed: false, lastAccessed: Date.now() });
            resolve(true);
          })
          .catch(() => {
            globalSwipeImageCache.set(optimizedUrl, { loaded: true, decoded: true, failed: false, lastAccessed: Date.now() });
            resolve(true);
          });
      } else {
        globalSwipeImageCache.set(optimizedUrl, { loaded: true, decoded: true, failed: false, lastAccessed: Date.now() });
        resolve(true);
      }
    };

    img.onerror = () => {
      globalSwipeImageCache.set(optimizedUrl, { loaded: false, decoded: false, failed: true, lastAccessed: Date.now() });
      resolve(false);
    };

    img.src = optimizedUrl;
  });
}

/**
 * Clear the entire image cache (useful for memory management)
 */
export function clearImageCache(): void {
  globalSwipeImageCache.clear();
  globalClientImageCache.clear();
}

/**
 * Get current cache size (for debugging/monitoring)
 */
export function getImageCacheSize(): number {
  return globalSwipeImageCache.size + globalClientImageCache.size;
}

// =============================================================================
// CLIENT PROFILE IMAGE CACHE
// Separate cache for client profile images (no URL transformation needed)
// =============================================================================
const globalClientImageCache = new Map<string, {
  loaded: boolean;
  decoded: boolean;
  failed: boolean;
}>();

/**
 * Check if a client profile image is already decoded in cache
 */
export function isClientImageDecodedInCache(url: string): boolean {
  const cached = globalClientImageCache.get(url);
  return cached?.decoded === true && !cached?.failed;
}

/**
 * Preload a client profile image into the cache
 * Returns a promise that resolves when image is decoded (or fails)
 */
export function preloadClientImageToCache(url: string): Promise<boolean> {
  const cached = globalClientImageCache.get(url);
  if (cached?.decoded && !cached?.failed) {
    return Promise.resolve(true);
  }

  // Already loading - wait for completion
  if (cached?.loaded && !cached?.decoded && !cached?.failed) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const current = globalClientImageCache.get(url);
        if (current?.decoded || current?.failed) {
          clearInterval(checkInterval);
          resolve(!current?.failed);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 3000);
    });
  }

  globalClientImageCache.set(url, { loaded: true, decoded: false, failed: false });

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    (img as any).fetchPriority = 'high';

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = async () => {
      try {
        if ('decode' in img) {
          await img.decode();
        }
        globalClientImageCache.set(url, { loaded: true, decoded: true, failed: false });
        cleanup();
        resolve(true);
      } catch {
        globalClientImageCache.set(url, { loaded: true, decoded: true, failed: false });
        cleanup();
        resolve(true);
      }
    };

    img.onerror = () => {
      globalClientImageCache.set(url, { loaded: true, decoded: false, failed: true });
      cleanup();
      resolve(false);
    };

    img.src = url;
  });
}
