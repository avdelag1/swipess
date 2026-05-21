
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
        // Fetch likes where direction='right' and target_type is listing or event
        const { data: likes, error } = await supabase
          .from('likes')
          .select('id, created_at, target_id, target_type')
          .eq('user_id', user.id)
          .eq('direction', 'right')
          .in('target_type', ['listing', 'event', 'profile'])
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('[useLikedProperties] Error fetching likes:', error);
          throw error;
        }

        if (!likes || likes.length === 0) {
          return [];
        }

        // Separate IDs by type
        const listingIds = likes
          .filter(l => l.target_type === 'listing')
          .map(l => l.target_id);
        
        const eventIds = likes
          .filter(l => l.target_type === 'event')
          .map(l => l.target_id);

        const profileIds = likes
          .filter(l => l.target_type === 'profile')
          .map(l => l.target_id);

        let listings: any[] = [];
        let events: any[] = [];
        let profiles: any[] = [];

        // Fetch Listings
        if (listingIds.length > 0) {
          const { data, error: err } = await supabase
            .from('listings')
            .select('*')
            .in('id', listingIds);
          if (!err) listings = data || [];
        }

        // Fetch Events
        if (eventIds.length > 0) {
          const { data, error: err } = await supabase
            .from('events')
            .select('*')
            .in('id', eventIds);
          if (!err) events = data || [];
        }

        // Fetch Profiles
        if (profileIds.length > 0) {
          const { data, error: err } = await supabase
            .from('client_profiles')
            .select('*')
            .in('user_id', profileIds);
          if (!err) {
            // Normalize profile to look like a listing so it can be displayed
            profiles = (data || []).map(p => ({
              ...p,
              id: p.user_id, // ensure id exists
              category: 'roommates',
              title: p.full_name || p.name || 'Roommate',
              price: p.budget_max,
              images: p.profile_images || (p.avatar_url ? [p.avatar_url] : []),
              owner_id: p.user_id, // they are their own owner
            }));
          }
        }

        // Create a unified map [id_type, data]
        const dataMap = new Map();
        listings.forEach(l => dataMap.set(`${l.id}_listing`, { ...l, target_type: 'listing' }));
        events.forEach(e => dataMap.set(`${e.id}_event`, { ...e, target_type: 'event' }));
        profiles.forEach(p => dataMap.set(`${p.id}_profile`, { ...p, target_type: 'profile' }));

        // Map back to the original order of likes
        const orderedListings = likes
          .map(like => dataMap.get(`${like.target_id}_${like.target_type}`))
          .filter(item => !!item);

        // PERFORMANCE: Preload images
        preloadLikedImages(orderedListings);

        return orderedListings;
      } catch (error) {
        logger.error('[useLikedProperties] Fatal error:', error);
        return [];
      }
    },
    // Allow invalidations from swipe / realtime to actually refetch the list.
    staleTime: 1000 * 30, // 30s — fresh enough to feel instant, cheap enough to not hammer
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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


