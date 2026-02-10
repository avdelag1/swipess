/**
 * AGGRESSIVE IMAGE PRELOAD CONTROLLER
 *
 * Ensures images are DECODED and ready before card is shown.
 * Never shows a card with unloaded image.
 *
 * Strategy:
 * 1. Preload current + next 3 cards on initialization
 * 2. After each swipe, preload next 2 cards
 * 3. Use decode() API to ensure GPU-ready
 * 4. Track loading state to prevent black frames
 */

import { getCardImageUrl, getPWACardImageUrl } from '@/utils/imageOptimization';

export interface ImageEntry {
  url: string;
  optimizedUrl: string;
  status: 'pending' | 'loading' | 'decoded' | 'failed';
  element: HTMLImageElement | null;
  decodedAt: number | null;
}

interface PreloadControllerConfig {
  prefetchCount: number;
  decodeTimeout: number;
  maxCacheSize: number;
  isPWA: boolean;
}

const DEFAULT_CONFIG: PreloadControllerConfig = {
  prefetchCount: 4,
  decodeTimeout: 3000,
  maxCacheSize: 100,
  isPWA: false,
};

class ImagePreloadController {
  private cache = new Map<string, ImageEntry>();
  private config: PreloadControllerConfig;
  private loadingPromises = new Map<string, Promise<boolean>>();

  constructor(config: Partial<PreloadControllerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update config (e.g., for PWA mode)
   */
  setConfig(config: Partial<PreloadControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get optimized URL based on mode
   */
  private getOptimizedUrl(rawUrl: string): string {
    return this.config.isPWA ? getPWACardImageUrl(rawUrl) : getCardImageUrl(rawUrl);
  }

  /**
   * Check if image is ready for display (decoded)
   */
  isReady(rawUrl: string): boolean {
    const optimizedUrl = this.getOptimizedUrl(rawUrl);
    const entry = this.cache.get(optimizedUrl);
    return entry?.status === 'decoded';
  }

  /**
   * Get entry for an image
   */
  getEntry(rawUrl: string): ImageEntry | null {
    const optimizedUrl = this.getOptimizedUrl(rawUrl);
    return this.cache.get(optimizedUrl) || null;
  }

  /**
   * Preload a single image with decode
   * Returns promise that resolves when image is GPU-ready
   */
  async preload(rawUrl: string, priority: 'high' | 'low' = 'high'): Promise<boolean> {
    if (!rawUrl || rawUrl === '/placeholder.svg') return false;

    const optimizedUrl = this.getOptimizedUrl(rawUrl);

    // Already decoded
    const existing = this.cache.get(optimizedUrl);
    if (existing?.status === 'decoded') return true;
    if (existing?.status === 'failed') return false;

    // Already loading - wait for it
    const loadingPromise = this.loadingPromises.get(optimizedUrl);
    if (loadingPromise) return loadingPromise;

    // Create new loading promise
    const promise = this.loadAndDecode(rawUrl, optimizedUrl, priority);
    this.loadingPromises.set(optimizedUrl, promise);

    const result = await promise;
    this.loadingPromises.delete(optimizedUrl);

    return result;
  }

  /**
   * Preload multiple images in priority order
   * Always keeps next 2-3 cards ready to prevent swipe delays
   */
  async preloadBatch(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && url !== '/placeholder.svg');

    // Preload first 3 with high priority (current, next, and backup)
    // This ensures no delay when swiping - the next card is always ready
    const highPriority = validUrls.slice(0, 3);
    const lowPriority = validUrls.slice(3);

    // Start high priority immediately
    await Promise.all(highPriority.map(url => this.preload(url, 'high')));

    // Low priority in background
    if (lowPriority.length > 0) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          lowPriority.forEach(url => this.preload(url, 'low'));
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          lowPriority.forEach(url => this.preload(url, 'low'));
        }, 100);
      }
    }
  }

  /**
   * Wait for specific image to be ready (with timeout)
   */
  async waitForReady(rawUrl: string, timeout = 3000): Promise<boolean> {
    const start = Date.now();
    const optimizedUrl = this.getOptimizedUrl(rawUrl);

    // Already ready
    if (this.isReady(rawUrl)) return true;

    // Start preloading if not already
    const preloadPromise = this.preload(rawUrl, 'high');

    // Race against timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    return Promise.race([preloadPromise, timeoutPromise]);
  }

  /**
   * Internal: Load and decode image
   */
  private async loadAndDecode(
    rawUrl: string,
    optimizedUrl: string,
    priority: 'high' | 'low'
  ): Promise<boolean> {
    // Create entry
    const entry: ImageEntry = {
      url: rawUrl,
      optimizedUrl,
      status: 'loading',
      element: null,
      decodedAt: null,
    };
    this.cache.set(optimizedUrl, entry);

    try {
      const img = new Image();
      img.decoding = 'async';
      (img as any).fetchPriority = priority;

      // Load image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Load failed'));
        img.src = optimizedUrl;
      });

      // Decode with timeout
      if ('decode' in img) {
        await Promise.race([
          img.decode(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Decode timeout')), this.config.decodeTimeout)
          ),
        ]);
      }

      // Success
      entry.status = 'decoded';
      entry.element = img;
      entry.decodedAt = Date.now();

      // Evict old entries if cache is full
      this.evictOldEntries();

      return true;
    } catch {
      entry.status = 'failed';
      return false;
    }
  }

  /**
   * Evict old entries to prevent memory bloat
   */
  private evictOldEntries(): void {
    if (this.cache.size <= this.config.maxCacheSize) return;

    // Sort by decode time, evict oldest
    const entries = Array.from(this.cache.entries())
      .filter(([_, entry]) => entry.status === 'decoded')
      .sort((a, b) => (a[1].decodedAt || 0) - (b[1].decodedAt || 0));

    const toEvict = entries.slice(0, entries.length - this.config.maxCacheSize);
    toEvict.forEach(([url]) => {
      this.cache.delete(url);
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats(): { total: number; decoded: number; loading: number; failed: number } {
    let decoded = 0;
    let loading = 0;
    let failed = 0;

    this.cache.forEach((entry) => {
      switch (entry.status) {
        case 'decoded': decoded++; break;
        case 'loading': loading++; break;
        case 'failed': failed++; break;
      }
    });

    return { total: this.cache.size, decoded, loading, failed };
  }
}

// Singleton instance
export const imagePreloadController = new ImagePreloadController();

// Export class for custom instances
export { ImagePreloadController };
