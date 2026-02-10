
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export interface InterestedClient {
  id: string; // like id
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar: string | null;
  };
  listing: {
    id: string;
    title: string;
  };
}

/**
 * OWNER SIDE - Fetch users who liked owner's listings
 *
 * This hook uses the RLS policy "owners can see likes on their listings"
 * to fetch all likes where the target listing is owned by the current user.
 *
 * ARCHITECTURE:
 * - Single source of truth from likes table
 * - Uses target_id with target_type='listing' to reference listings
 * - Joins with profiles and listings for display data
 */
export function useOwnerInterestedClients() {
  return useQuery<InterestedClient[]>({
    queryKey: ['owner-interested-clients'],
    // Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const ownerId = userData.user.id;

      // First, get all listings owned by this user
      const { data: ownerListings, error: listingsError } = await supabase
        .from('listings')
        .select('id')
        .eq('owner_id', ownerId);

      if (listingsError) {
        logger.error('[useOwnerInterestedClients] Error fetching owner listings:', listingsError);
        throw listingsError;
      }

      if (!ownerListings || ownerListings.length === 0) {
        return [];
      }

      const listingIds = ownerListings.map(l => l.id);

      // CORRECT QUERY: Fetch likes on owner's listings
      // Schema: target_id = listing ID, target_type = 'listing', direction = 'like'
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          user_id,
          target_id
        `)
        .in('target_id', listingIds)
        .eq('target_type', 'listing')
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[useOwnerInterestedClients] Error fetching likes:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch user profiles for all users who liked
      const userIds = [...new Set(data.map((like: any) => like.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        logger.error('[useOwnerInterestedClients] Error fetching profiles:', profilesError);
      }

      // Fetch listing details
      const { data: listings, error: listingsDetailError } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds);

      if (listingsDetailError) {
        logger.error('[useOwnerInterestedClients] Error fetching listing details:', listingsDetailError);
      }

      // Map profiles and listings to lookups
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));

      // Combine the data
      const interestedClients: InterestedClient[] = data
        .map((like: any) => {
          const profile = profileMap.get(like.user_id);
          const listing = listingMap.get(like.target_id);

          if (!profile || !listing) {
            return null;
          }

          return {
            id: like.id,
            created_at: like.created_at,
            user: {
              id: profile.id,
              full_name: profile.full_name || 'Anonymous',
              avatar: profile.avatar_url
            },
            listing: {
              id: listing.id,
              title: listing.title || 'Untitled Listing'
            }
          };
        })
        .filter((item): item is InterestedClient => item !== null);

      return interestedClients;
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
