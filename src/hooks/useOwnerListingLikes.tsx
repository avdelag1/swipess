import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

/**
 * Fetch likes received on owner's listings.
 * 
 * ARCHITECTURE:
 * - Uses likes table with direction='right' and target_type='listing'
 * - Fetches listings owned by the current user that have been liked
 */
export function useOwnerListingLikes() {
  return useQuery({
    queryKey: ['owner-listing-likes'],
    queryFn: async () => {
      // First get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.error('[useOwnerListingLikes] Auth error:', authError);
        return [];
      }

      // Fetch listings owned by this user
      const { data: listings, error } = await supabase
        .from('listings')
        .select('id, title, price, images, category, status, created_at')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[useOwnerListingLikes] Error fetching listings:', error);
        return [];
      }

      if (!listings || listings.length === 0) {
        return [];
      }

      // Get like counts for each listing
      const listingIds = listings.map(l => l.id);
      
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('target_id, created_at, user_id')
        .eq('target_type', 'listing')
        .eq('direction', 'right')
        .in('target_id', listingIds);

      if (likesError) {
        logger.error('[useOwnerListingLikes] Error fetching likes:', likesError);
        return [];
      }

      // Group likes by listing
      const likeCounts: Record<string, number> = {};
      const likeData: Record<string, { date: string; userId: string }[]> = {};
      
      (likes || []).forEach((like: any) => {
        if (!like.target_id) return;
        if (!likeCounts[like.target_id]) {
          likeCounts[like.target_id] = 0;
          likeData[like.target_id] = [];
        }
        likeCounts[like.target_id]++;
        likeData[like.target_id].push({
          date: like.created_at,
          userId: like.user_id
        });
      });

      // Combine listing info with like counts
      const listingsWithLikes = listings.map(listing => ({
        ...listing,
        likeCount: likeCounts[listing.id] || 0,
        recentLikes: likeData[listing.id] || []
      }));

      return listingsWithLikes;
    },
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
}

/**
 * Fetch detailed list of users who liked a specific listing
 */
export function useListingLikers(listingId: string | null) {
  return useQuery({
    queryKey: ['listing-likers', listingId],
    queryFn: async () => {
      if (!listingId) return [];

      const { data: likes, error } = await supabase
        .from('likes')
        .select(`
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('target_id', listingId)
        .eq('target_type', 'listing')
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[useListingLikers] Error fetching likers:', error);
        return [];
      }

      return (likes || []).map((like: any) => ({
        id: like.user_id,
        fullName: like.profiles?.full_name || 'Anonymous',
        avatarUrl: like.profiles?.avatar_url,
        likedAt: like.created_at
      }));
    },
    enabled: !!listingId,
    staleTime: 30000,
  });
}
