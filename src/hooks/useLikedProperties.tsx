
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from './useListings';
import { logger } from '@/utils/prodLogger';
import { likedImagesCache } from '@/utils/likedImagesCache';
import { getCardImageUrl, getThumbnailUrl } from '@/utils/imageOptimization';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetch liked properties using the unified likes table.
 *
 * ARCHITECTURE:
 * - Uses likes table with direction='right' and target_type='listing'
 * - This hook fetches ONLY from Supabase (single source of truth)
 * - Never derives likes from swipe state
 * - PRELOADS images immediately for instant carousel/gallery
 */
export function useLikedProperties() {
  const { user, initialized } = useAuth();

  return useQuery<Listing[]>({
    queryKey: ['liked-properties'],
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    // CRITICAL: Prevent caching an empty list before auth is initialized.
    enabled: initialized && !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Fetch likes where direction='right' and target_type='listing'
        const { data: likes, error } = await supabase
          .from('likes')
          .select('id, created_at, target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'listing')
          .eq('direction', 'right')
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('[useLikedProperties] Error fetching likes:', error);
          throw error;
        }

        // If no likes found, return empty array
        if (!likes || likes.length === 0) {
          return [];
        }

        // Get listing IDs from the likes (filter out nulls)
        const listingIds = likes
          .map((like: any) => like.target_id)
          .filter((id: any): id is string => id !== null && id !== undefined);

        if (listingIds.length === 0) {
          return [];
        }

        // Remove duplicates
        const uniqueListingIds = [...new Set(listingIds)];

        // Fetch the actual listings
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .in('id', uniqueListingIds)
          .eq('status', 'active');

        if (listingsError) {
          logger.error('[useLikedProperties] Error fetching listings:', listingsError);
          throw listingsError;
        }

        // Map listings to maintain the order of likes
        const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));
        const orderedListings = listingIds
          .map((id: string) => listingMap.get(id))
          .filter((listing): listing is Listing => listing !== null && listing !== undefined);

        // PERFORMANCE: Preload images for ALL liked properties immediately
        preloadLikedImages(orderedListings);

        return orderedListings;
      } catch (error) {
        logger.error('[useLikedProperties] Fatal error:', error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }
    },
    staleTime: Infinity, // Never mark as stale - rely on optimistic updates
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1
  });
}

/**
 * Aggressively preload images for liked properties
 * Called when liked properties are fetched
 */
function preloadLikedImages(listings: Listing[]): void {
  if (!listings || listings.length === 0) return;

  // Use requestIdleCallback to not block rendering
  const preload = () => {
    // Priority: First image of first 5 listings (visible immediately)
    const priorityImages: string[] = [];
    const secondaryImages: string[] = [];

    listings.forEach((listing, listingIdx) => {
      const images = listing.images || [];
      if (images.length === 0) return;

      images.forEach((url, imgIdx) => {
        if (listingIdx < 5 && imgIdx === 0) {
          // First image of first 5 listings = high priority
          priorityImages.push(url);
        } else if (listingIdx < 10 && imgIdx < 3) {
          // First 3 images of first 10 listings = secondary priority
          secondaryImages.push(url);
        }
      });

      // Cache all images for the listing
      likedImagesCache.preloadListing(listing.id, images);
    });

    // Load priority images immediately (card view)
    priorityImages.forEach(url => {
      const img = new Image();
      img.decoding = 'async';
      (img as any).fetchPriority = 'high';
      img.src = getCardImageUrl(url);
    });

    // Load thumbnails for gallery mini-carousel
    priorityImages.concat(secondaryImages.slice(0, 10)).forEach(url => {
      const img = new Image();
      img.decoding = 'async';
      img.src = getThumbnailUrl(url);
    });

    // Load secondary images in background
    setTimeout(() => {
      secondaryImages.forEach(url => {
        const img = new Image();
        img.decoding = 'async';
        img.src = getCardImageUrl(url);
      });
    }, 100);
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 50);
  }
}
