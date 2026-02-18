// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OwnerStats {
  activeProperties: number;
  totalInquiries: number;
  activeMatches: number;
  totalViews: number;
  totalLikes: number;
  responseRate: number;
  likedClientsCount: number;  // Clients the owner has liked
  interestedClientsCount: number;  // Clients who liked owner's listings
}

export function useOwnerStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-stats', user?.id],
    queryFn: async (): Promise<OwnerStats> => {
      if (!user) throw new Error('User not authenticated');

      // Run all queries in parallel for faster loading
      const [
        propertiesResult,
        matchesResult,
        conversationsResult,
        listingsResult,
        likedClientsResult,
      ] = await Promise.all([
        (supabase as any)
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('status', 'active'),
        // Query listing IDs for this owner (to count likes from likes table)
        supabase
          .from('listings')
          .select('id')
          .eq('owner_id', user.id),
        // Count clients the owner has liked (using likes table with target_type='profile')
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('target_type', 'profile'),
      ]);

      const activeProperties = propertiesResult.count || 0;
      const totalMatches = matchesResult.count || 0;
      const activeConversations = conversationsResult.count || 0;

      const likedClientsCount = likedClientsResult.count || 0;

      // Count interested clients (who liked owner's listings) and total likes
      let interestedClientsCount = 0;
      let totalLikes = 0;
      const ownerListingIds = (listingsResult.data as any[] || []).map(l => l.id);

      if (ownerListingIds.length > 0) {
        // Count unique clients who liked any of the owner's listings
        const { count: interestedCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('target_id', ownerListingIds)
          .eq('target_type', 'listing')
          .eq('direction', 'right');
        interestedClientsCount = interestedCount || 0;

        // Count total likes on owner's listings
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('target_id', ownerListingIds)
          .eq('direction', 'right');
        totalLikes = likesCount || 0;
      }

      // No view tracking table exists — default to 0
      const totalViews = 0;

      // Calculate response rate
      const responseRate = totalMatches > 0 ? Math.round(activeConversations * 100 / totalMatches) : 0;

      return {
        activeProperties,
        totalInquiries: totalMatches,
        activeMatches: activeConversations,
        totalViews,
        totalLikes,
        responseRate,
        likedClientsCount,
        interestedClientsCount
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}