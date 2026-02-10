/**
 * Image optimization utilities for lightning-fast photo loading
 * Optimizes Supabase storage URLs with transformations for better performance
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Optimize Supabase storage image URL with transformation parameters
 * Reduces file size and improves load times dramatically
 *
 * CRITICAL: Handles signed URLs correctly - preserves token parameter
 * Signed URLs contain auth tokens that must not be corrupted
 */
export function optimizeImageUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  // Skip if not a valid URL or not a Supabase storage URL
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Skip non-Supabase URLs entirely (external images, placeholders, data URIs)
  if (!url.includes('supabase.co/storage')) {
    return url;
  }

  // CRITICAL: Skip signed URLs - they have auth parameters that cannot be modified
  // Modifying query params on signed URLs will invalidate the signature
  // Common signed URL patterns:
  // - Supabase: ?token=...
  // - AWS S3: ?Signature=... or ?X-Amz-Signature=...
  // - Google Cloud: ?Signature=... or ?X-Goog-Signature=...
  // - Azure Blob: ?sig=... or ?sv=...
  const signedUrlPatterns = [
    'token=',           // Supabase
    'Signature=',       // AWS S3, GCS
    'X-Amz-Signature=', // AWS S3 v4
    'X-Goog-Signature=',// Google Cloud Storage
    'sig=',             // Azure Blob
    'sv=',              // Azure Blob (version)
  ];
  if (signedUrlPatterns.some(pattern => url.includes(pattern))) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;

  try {
    // Parse the URL safely
    const urlObj = new URL(url);

    // Preserve existing params and add transformation params
    const params = new URLSearchParams(urlObj.search);

    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);
    params.set('resize', resize);

    // Return optimized URL
    urlObj.search = params.toString();
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original URL unchanged
    return url;
  }
}

/**
 * Get optimized thumbnail URL (small preview)
 */
export function getThumbnailUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 400,
    height: 400,
    quality: 75,
    format: 'webp'
  });
}

/**
 * Get optimized card image URL (swipe cards)
 * Standard browser mode - higher quality
 */
export function getCardImageUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 800,
    height: 1200,
    quality: 85,
    format: 'webp'
  });
}

/**
 * Get PWA-optimized card image URL (swipe cards in PWA mode)
 * Lower quality and smaller dimensions for faster decoding in PWA shell
 *
 * PWA shells have:
 * - Less aggressive GPU acceleration
 * - More memory pressure
 * - Slower image decode times
 *
 * So we sacrifice some quality for responsiveness
 */
export function getPWACardImageUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 640,      // Reduced from 800 - less pixels to decode
    height: 960,     // Reduced from 1200
    quality: 70,     // Reduced from 85 - smaller file size
    format: 'webp'
  });
}

/**
 * Get optimized full-size image URL (gallery view)
 */
export function getFullImageUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 1920,
    quality: 90,
    format: 'webp'
  });
}

/**
 * Generate blur data URL for progressive loading
 * Creates a tiny blurred placeholder while full image loads
 */
export function getBlurDataUrl(url: string): string {
  // Return SVG placeholder for non-Supabase URLs
  if (!url || !url.includes('supabase.co/storage')) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
  }

  // Check for signed URLs - cannot transform, return placeholder
  const signedUrlPatterns = ['token=', 'Signature=', 'X-Amz-Signature=', 'X-Goog-Signature=', 'sig=', 'sv='];
  if (signedUrlPatterns.some(pattern => url.includes(pattern))) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
  }

  return optimizeImageUrl(url, {
    width: 10,
    height: 10,
    quality: 30,
    format: 'webp'
  });
}

/**
 * Preload an image into browser cache
 * Returns promise that resolves when image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve();
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'high';

    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

    img.src = url;

    // Force decode if supported
    if ('decode' in img) {
      img.decode().then(resolve).catch(reject);
    }
  });
}

/**
 * Batch preload multiple images
 * Preloads in parallel for maximum speed
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const validUrls = urls.filter(url => url && url !== '/placeholder.svg' && url !== '/placeholder-avatar.svg');

  await Promise.allSettled(
    validUrls.map(url => preloadImage(url))
  );
}

/**
 * Ultra-Fast Image Preloader with priority queue
 * Preloads images in order of importance
 */
class ImagePreloadQueue {
  private queue: Array<{ url: string; priority: number; resolve: () => void }> = [];
  private loading = 0;
  private readonly maxConcurrent = 4;

  add(url: string, priority: number = 0): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ url, priority, resolve });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.loading < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      this.loading++;
      preloadImage(item.url)
        .finally(() => {
          this.loading--;
          item.resolve();
          this.processQueue();
        });
    }
  }
}

export const imagePreloadQueue = new ImagePreloadQueue();

/**
 * Create responsive srcset for optimal image loading
 * Returns empty string for signed URLs (cannot be transformed)
 */
export function createSrcSet(url: string): string {
  // Skip non-Supabase URLs - cannot generate srcset
  if (!url || !url.includes('supabase.co/storage')) {
    return '';
  }

  // Check for signed URLs - cannot transform
  const signedUrlPatterns = ['token=', 'Signature=', 'X-Amz-Signature=', 'X-Goog-Signature=', 'sig=', 'sv='];
  if (signedUrlPatterns.some(pattern => url.includes(pattern))) {
    return '';
  }

  const sizes = [320, 640, 960, 1280, 1920];
  return sizes
    .map(size => `${optimizeImageUrl(url, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Get optimal image size based on viewport and device pixel ratio
 */
export function getOptimalImageSize(containerWidth: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const optimalWidth = containerWidth * dpr;

  // Round up to nearest size step for better caching
  const sizeSteps = [320, 640, 960, 1280, 1920];
  return sizeSteps.find(size => size >= optimalWidth) || 1920;
}

/**
 * Create lazy loading observer for images
 * Uses Intersection Observer for viewport-based loading
 */
export function createImageObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '200px', // Start loading 200px before visible
      threshold: 0,
      ...options,
    }
  );
}

/**
 * Native lazy loading attributes for images
 */
export const lazyImageProps = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
};

/**
 * Priority image loading attributes (for above-fold images)
 */
export const priorityImageProps = {
  loading: 'eager' as const,
  decoding: 'async' as const,
  fetchPriority: 'high' as const,
};

/**
 * PWA-Aggressive Image Preloader
 *
 * In PWA mode, we need to be more aggressive with preloading because:
 * - Image decode is slower in PWA shell
 * - Memory pressure causes micro-freezes
 * - Images not already decoded will cause swipe lag
 *
 * This preloader:
 * - Decodes images synchronously when possible
 * - Keeps decoded images in memory
 * - Preloads more images ahead
 */
export class PWAImagePreloader {
  private decodedCache = new Map<string, HTMLImageElement>();
  private decoding = new Set<string>();
  private maxCached = 10; // Keep last 10 images decoded in memory

  /**
   * Aggressively preload and decode image for PWA mode
   * Returns the decoded image element for immediate display
   */
  async preloadAndDecode(url: string): Promise<HTMLImageElement | null> {
    if (!url) return null;

    // Already decoded and cached
    if (this.decodedCache.has(url)) {
      return this.decodedCache.get(url)!;
    }

    // Already being decoded
    if (this.decoding.has(url)) {
      // Wait for existing decode
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.decodedCache.has(url)) {
            clearInterval(checkInterval);
            resolve(this.decodedCache.get(url)!);
          }
        }, 50);
        // Timeout after 3s
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 3000);
      });
    }

    this.decoding.add(url);

    try {
      const img = new Image();
      img.decoding = 'async';
      (img as any).fetchPriority = 'high';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      // Force decode
      if ('decode' in img) {
        await img.decode();
      }

      // Cache the decoded image
      this.decodedCache.set(url, img);
      this.decoding.delete(url);

      // Evict old entries if cache is full
      if (this.decodedCache.size > this.maxCached) {
        const firstKey = this.decodedCache.keys().next().value;
        if (firstKey) this.decodedCache.delete(firstKey);
      }

      return img;
    } catch {
      this.decoding.delete(url);
      return null;
    }
  }

  /**
   * Batch preload multiple images for PWA
   * More aggressive than standard preloader
   */
  async batchPreload(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url =>
      url && url !== '/placeholder.svg' && !this.decodedCache.has(url)
    );

    // Preload all in parallel
    await Promise.allSettled(
      validUrls.map(url => this.preloadAndDecode(url))
    );
  }

  /**
   * Check if image is already decoded and ready
   */
  isDecoded(url: string): boolean {
    return this.decodedCache.has(url);
  }

  /**
   * Get decoded image if available
   */
  getDecoded(url: string): HTMLImageElement | null {
    return this.decodedCache.get(url) || null;
  }

  /**
   * Clear cache to free memory
   */
  clear(): void {
    this.decodedCache.clear();
    this.decoding.clear();
  }
}

// Global PWA image preloader instance
export const pwaImagePreloader = new PWAImagePreloader();
