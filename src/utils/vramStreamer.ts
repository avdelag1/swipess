/**
 * ⚡ VRAM IMAGE STREAMER — Zero-Flicker Image Pre-loader
 *
 * Pre-fetches upcoming card images as in-memory Blob URLs,
 * so when the user swipes, the next card's photo is already
 * sitting in the browser's VRAM — zero network delay, zero flicker.
 *
 * Strategy:
 *   1. On mount, pre-fetch the first N images from the card stack.
 *   2. When the top card changes (swipe), pre-fetch the next batch.
 *   3. Blob URLs are revoked when no longer needed to prevent memory leaks.
 */

const blobCache = new Map<string, string>();
const inflight = new Set<string>();
const MAX_PREFETCH = 5;

/**
 * Convert a remote image URL into a local Blob URL stored in VRAM.
 * Returns the blob URL immediately if cached, otherwise fetches in background.
 */
export function getBlobUrl(src: string): string | null {
  return blobCache.get(src) || null;
}

/**
 * Pre-stream a single image into VRAM as a Blob URL.
 */
async function streamToBlob(src: string): Promise<string | null> {
  if (blobCache.has(src) || inflight.has(src)) return blobCache.get(src) || null;
  inflight.add(src);

  try {
    const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    blobCache.set(src, blobUrl);
    return blobUrl;
  } catch (err) {
    // Silently fail — the <img> tag will fall back to normal loading
    console.debug('[VRAMStreamer] Failed to pre-stream:', src, err);
    return null;
  } finally {
    inflight.delete(src);
  }
}

/**
 * Pre-fetch a batch of image URLs into VRAM Blob cache.
 * Call this whenever the card stack order changes.
 */
export function prefetchImages(urls: string[], count = MAX_PREFETCH): void {
  const batch = urls.slice(0, count);
  batch.forEach((url) => {
    if (!blobCache.has(url) && !inflight.has(url)) {
      // Use requestIdleCallback to avoid blocking main thread
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => streamToBlob(url), { timeout: 2000 });
      } else {
        setTimeout(() => streamToBlob(url), 50);
      }
    }
  });
}

/**
 * Revoke old blob URLs that are no longer in the active set.
 * Call this periodically or when the card set changes significantly.
 */
export function pruneCache(activeUrls: Set<string>): void {
  for (const [src, blobUrl] of blobCache.entries()) {
    if (!activeUrls.has(src)) {
      URL.revokeObjectURL(blobUrl);
      blobCache.delete(src);
    }
  }
}

/**
 * React hook-friendly: get a blob URL with auto-fallback to original src.
 */
export function useResolvedSrc(src: string): string {
  return blobCache.get(src) || src;
}

/**
 * Get cache stats for debugging.
 */
export function getCacheStats() {
  return {
    cached: blobCache.size,
    inflight: inflight.size,
  };
}
