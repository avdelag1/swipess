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
        interestedClientsResult
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
        // Query listings with views and likes columns (use views not view_count)
        supabase
          .from('listings')
          .select('views, likes')
          .eq('owner_id', user.id),
        // Count clients the owner has liked (using likes table with target_type='profile')
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('target_type', 'profile'),
        // Count clients who liked the owner's listings (get listing IDs first)
        supabase
          .from('listings')
          .select('id')
          .eq('owner_id', user.id)
      ]);

      const activeProperties = propertiesResult.count || 0;
      const totalMatches = matchesResult.count || 0;
      const activeConversations = conversationsResult.count || 0;

      const totalViews = (listingsResult.data as any[])?.reduce((sum, listing) => sum + (listing.views || 0), 0) || 0;
      const totalLikes = (listingsResult.data as any[])?.reduce((sum, listing) => sum + (listing.likes || 0), 0) || 0;

      const likedClientsCount = likedClientsResult.count || 0;

      // Count interested clients (who liked owner's listings)
      let interestedClientsCount = 0;
      if (interestedClientsResult.data && interestedClientsResult.data.length > 0) {
        const listingIds = interestedClientsResult.data.map(l => l.id);
        // SCHEMA: target_id = listing ID, target_type = 'listing', direction = 'like'
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('target_id', listingIds)
          .eq('target_type', 'listing')
          .eq('direction', 'like');
        interestedClientsCount = count || 0;
      }

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