/**
 * Shared image cache for CardImage components
 *
 * This cache is used across all card images to:
 * - Prevent re-loading images that have already been loaded
 * - Enable instant display of cached images (no fade transition)
 * - Support aggressive preloading of card images
 *
 * Bounded to 150 entries to prevent unbounded memory growth on long sessions.
 */
class BoundedImageCache extends Map<string, boolean> {
  private readonly maxSize: number;
  constructor(maxSize = 150) {
    super();
    this.maxSize = maxSize;
  }
  set(key: string, value: boolean): this {
    if (this.size >= this.maxSize) {
      // Evict oldest entry (first inserted key)
      const oldest = this.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
    }
    return super.set(key, value);
  }
}

export const imageCache = new BoundedImageCache(150);


