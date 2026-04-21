import { useEffect, useRef, useMemo } from 'react';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { getNetworkProfile } from '@/utils/networkAware';

interface PrefetchOptions {
  currentIndex: number;
  profiles: any[];
  prefetchCount?: number;
  /**
   * PERF FIX: State-driven trigger to force effect re-run.
   */
  trigger?: number;
}

/**
 * Network-aware image prefetching — adapts depth and decode strategy
 * based on connection quality and device memory.
 *
 * - 4g + 4GB+: prefetch 5 cards, pre-decode all
 * - 3g or <4GB: prefetch 2 cards, pre-decode hero only
 * - 2g / save-data: prefetch 1 card, no decode
 */
export function usePrefetchImages({
  currentIndex,
  profiles,
  prefetchCount = 3,
  trigger = 0
}: PrefetchOptions) {
  const prefetchedItemIds = useRef(new Set<string>());

  const nextProfileIds = useMemo(() => {
    return profiles
      .slice(currentIndex + 1, currentIndex + 1 + prefetchCount)
      .map(p => p?.id || p?.user_id || '')
      .filter(Boolean)
      .join(',');
  }, [profiles, currentIndex, prefetchCount]);

  useEffect(() => {
    if (!profiles.length || currentIndex >= profiles.length) return;

    // 🚀 Network-aware: dynamically scale prefetch depth
    const netProfile = getNetworkProfile();
    const effectiveCount = Math.min(prefetchCount, netProfile.prefetchDepth);

    const profilesToPrefetch = profiles.slice(
      currentIndex + 1,
      currentIndex + 1 + effectiveCount
    );

    profilesToPrefetch.forEach((profile, offset) => {
      if (!profile) return;

      const itemId = profile.id || profile.user_id;
      if (!itemId) return;
      if (prefetchedItemIds.current.has(itemId)) return;
      prefetchedItemIds.current.add(itemId);

      const imagesToPrefetch: string[] = [];

      if (profile.images && Array.isArray(profile.images)) {
        imagesToPrefetch.push(...profile.images.slice(0, 2));
      } else if (profile.profile_images && Array.isArray(profile.profile_images)) {
        imagesToPrefetch.push(...profile.profile_images.slice(0, 2));
      } else if (profile.avatar_url) {
        imagesToPrefetch.push(profile.avatar_url);
      }

      const prefetchImages = () => {
        imagesToPrefetch.forEach((imageUrl, imgIndex) => {
          if (imageUrl && imageUrl !== '/placeholder.svg' && imageUrl !== '/placeholder-avatar.svg') {
            const optimizedUrl = getCardImageUrl(imageUrl);
            if (imageCache.has(optimizedUrl)) return;

            const img = new Image();
            (img as any).fetchPriority = (offset <= 1 && imgIndex === 0) ? 'high' : 'low';
            img.decoding = 'async';

            img.onload = () => {
              imageCache.set(optimizedUrl, true);
            };

            img.src = optimizedUrl;

            // Only pre-decode if network profile allows it
            if (netProfile.enablePreDecode && 'decode' in img) {
              img.decode().then(() => {
                imageCache.set(optimizedUrl, true);
              }).catch(() => {});
            }
          }
        });
      };

      if (offset <= 1) {
        prefetchImages();
      } else if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prefetchImages, { timeout: 2000 });
      } else {
        setTimeout(prefetchImages, 100 * offset);
      }
    });

    if (prefetchedItemIds.current.size > 100) {
      const idsArray = Array.from(prefetchedItemIds.current);
      prefetchedItemIds.current = new Set(idsArray.slice(-50));
    }
     
  }, [currentIndex, profiles, prefetchCount, nextProfileIds, trigger]);
}

