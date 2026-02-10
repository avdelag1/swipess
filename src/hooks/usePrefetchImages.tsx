import { useEffect, useRef, useMemo } from 'react';
import { getCardImageUrl } from '@/utils/imageOptimization';

interface PrefetchOptions {
  currentIndex: number;
  profiles: any[];
  prefetchCount?: number;
  /**
   * PERF FIX: State-driven trigger to force effect re-run.
   * Parent components using refs for currentIndex/profiles must pass
   * a state value (like renderKey) that updates on each swipe.
   * Without this, the effect won't re-run because refs don't trigger re-renders.
   */
  trigger?: number;
}

/**
 * Optimized image prefetching - ensures next 2-3 cards are always ready
 *
 * PERFORMANCE FIXES:
 * - Preload next 3 profiles (current visible + 2 backup) with HIGH priority
 * - First 2 images per profile (hero + next)
 * - First 2 cards load immediately, 3rd uses requestIdleCallback
 * - Tracks by item ID (not index) to handle deck truncation correctly
 * - Aggressive priority for next 2 cards to prevent swipe delays
 * - Added trigger parameter to ensure effect runs when refs change
 */
export function usePrefetchImages({
  currentIndex,
  profiles,
  prefetchCount = 3,
  trigger = 0
}: PrefetchOptions) {
  // FIX: Track by item ID, not index - handles deck truncation correctly
  const prefetchedItemIds = useRef(new Set<string>());
  const imageCache = useRef(new Map<string, HTMLImageElement>());

  // Compute stable profile ID for dependency tracking
  // This ensures effect re-runs when the actual items at these indices change
  const nextProfileIds = useMemo(() => {
    return profiles
      .slice(currentIndex + 1, currentIndex + 1 + prefetchCount)
      .map(p => p?.id || p?.user_id || '')
      .filter(Boolean)
      .join(',');
  }, [profiles, currentIndex, prefetchCount]);

  useEffect(() => {
    // Skip if no profiles to prefetch
    if (!profiles.length || currentIndex >= profiles.length) return;

    // Get next N profiles to prefetch
    const profilesToPrefetch = profiles.slice(
      currentIndex + 1,
      currentIndex + 1 + prefetchCount
    );

    // Prefetch images for each profile
    profilesToPrefetch.forEach((profile, offset) => {
      if (!profile) return;

      // FIX: Use item ID for tracking, not index
      const itemId = profile.id || profile.user_id;
      if (!itemId) return;

      // Skip if already prefetched this item
      if (prefetchedItemIds.current.has(itemId)) return;

      // Mark as prefetched
      prefetchedItemIds.current.add(itemId);

      // Only collect first 2 images (hero + next), not ALL images
      const imagesToPrefetch: string[] = [];

      // For property listings - only first 2 images
      if (profile.images && Array.isArray(profile.images)) {
        imagesToPrefetch.push(...profile.images.slice(0, 2));
      }
      // For client profiles - check profile_images array
      else if (profile.profile_images && Array.isArray(profile.profile_images)) {
        imagesToPrefetch.push(...profile.profile_images.slice(0, 2));
      }
      // Fallback to avatar if no property images
      else if (profile.avatar_url) {
        imagesToPrefetch.push(profile.avatar_url);
      }

      // Prefetch function
      const prefetchImages = () => {
        imagesToPrefetch.forEach((imageUrl, imgIndex) => {
          if (imageUrl && imageUrl !== '/placeholder.svg' && imageUrl !== '/placeholder-avatar.svg') {
            const optimizedUrl = getCardImageUrl(imageUrl);

            // Skip if already in cache
            if (imageCache.current.has(optimizedUrl)) return;

            const img = new Image();

            // HIGH priority for next 2 cards to ensure they're always ready
            // This prevents any delay when swiping
            (img as any).fetchPriority = (offset <= 1 && imgIndex === 0) ? 'high' : 'low';
            img.decoding = 'async';

            // Store in cache to prevent re-fetching
            imageCache.current.set(optimizedUrl, img);
            img.src = optimizedUrl;
          }
        });
      };

      // First 2 profiles prefetch immediately (next card + backup), 3rd uses idle time
      if (offset <= 1) {
        prefetchImages();
      } else if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prefetchImages, { timeout: 2000 });
      } else {
        // Fallback: delay non-critical prefetches
        setTimeout(prefetchImages, 100 * offset);
      }
    });

    // FIX: Clean up old prefetched IDs to prevent memory leak (keep last 100)
    if (prefetchedItemIds.current.size > 100) {
      const idsArray = Array.from(prefetchedItemIds.current);
      const toKeep = new Set(idsArray.slice(-50)); // Keep most recent 50
      prefetchedItemIds.current = toKeep;
    }

    // Clean up old cached images (keep last 40)
    if (imageCache.current.size > 40) {
      const keys = Array.from(imageCache.current.keys());
      const toRemove = keys.slice(0, keys.length - 40);
      toRemove.forEach(key => imageCache.current.delete(key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, profiles, prefetchCount, nextProfileIds, trigger]);
}
