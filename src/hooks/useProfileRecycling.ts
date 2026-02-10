import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

interface ProfileView {
  id: string;
  user_id: string;
  viewed_profile_id: string;
  view_type: 'profile' | 'listing';
  action: 'like' | 'pass' | 'view';
  created_at: string;
}

// Record a profile view for smart recycling
export function useRecordProfileView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      viewType, 
      action 
    }: { 
      profileId: string; 
      viewType: 'profile' | 'listing'; 
      action: 'like' | 'pass' | 'view';
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // NOTE: Using 'as any' because profile_views table is not in auto-generated types
      const { data, error } = await (supabase as any)
        .from('profile_views')
        .upsert({
          user_id: user.user.id,
          viewed_profile_id: profileId,
          view_type: viewType,
          action,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,viewed_profile_id,view_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-views'] });
      queryClient.invalidateQueries({ queryKey: ['excluded-profiles'] });
    }
  });
}

// Get excluded profiles (disliked/passed within last 1 day) - resets after next day
export function usePermanentlyExcludedProfiles(viewType: 'profile' | 'listing' = 'profile') {
  return useQuery({
    queryKey: ['permanently-excluded', viewType],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Get passed/disliked cards from last 1 day (reset after next day)
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      // NOTE: Using 'as any' because profile_views table is not in auto-generated types
      const { data: passedCards, error } = await (supabase as any)
        .from('profile_views')
        .select('viewed_profile_id, created_at')
        .eq('user_id', user.user.id)
        .eq('view_type', viewType)
        .eq('action', 'pass')
        .gte('created_at', oneDayAgo) as { data: { viewed_profile_id: string; created_at: string }[] | null; error: any };

      if (error) {
        logger.error('Error fetching permanently excluded profiles:', error);
        return [];
      }

      if (!passedCards?.length) return [];

      // For listings: check if they were updated AFTER the swipe
      if (viewType === 'listing') {
        const listingIds = passedCards.map(p => p.viewed_profile_id);
        const { data: listings } = await supabase
          .from('listings')
          .select('id, created_at')
          .in('id', listingIds) as { data: { id: string; created_at: string }[] | null };

        // Filter out listings that were updated after swipe (show them again)
        const stillExcluded = passedCards.filter(card => {
          const listing = listings?.find(l => l.id === card.viewed_profile_id);
          if (!listing?.created_at) return true; // No update info, stay excluded
          // Use created_at as fallback since updated_at might not exist
          return new Date(listing.created_at) <= new Date(card.created_at);
        });

        return stillExcluded.map(v => v.viewed_profile_id);
      }

      // For client profiles: check if they were updated AFTER the swipe
      if (viewType === 'profile') {
        const profileIds = passedCards.map(p => p.viewed_profile_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, updated_at')
          .in('id', profileIds);

        const stillExcluded = passedCards.filter(card => {
          const profile = profiles?.find(p => p.id === card.viewed_profile_id);
          if (!profile?.updated_at) return true;
          return new Date(profile.updated_at) <= new Date(card.created_at);
        });

        return stillExcluded.map(v => v.viewed_profile_id);
      }

      return passedCards.map(v => v.viewed_profile_id);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get temporarily excluded profiles (liked in last 1 day - reset after next day)
export function useTemporarilyExcludedProfiles(viewType: 'profile' | 'listing' = 'profile') {
  return useQuery({
    queryKey: ['temp-excluded-likes', viewType],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

      // NOTE: Using 'as any' because profile_views table is not in auto-generated types
      const { data, error } = await (supabase as any)
        .from('profile_views')
        .select('viewed_profile_id')
        .eq('user_id', user.user.id)
        .eq('view_type', viewType)
        .eq('action', 'like')
        .gte('created_at', oneDayAgo) as { data: { viewed_profile_id: string }[] | null; error: any };

      if (error) {
        logger.error('Error fetching temporarily excluded profiles:', error);
        return [];
      }

      return data?.map(v => v.viewed_profile_id) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Combined exclusion hook for convenience
export function useExcludedProfiles(viewType: 'profile' | 'listing' = 'profile') {
  const { data: permanent = [] } = usePermanentlyExcludedProfiles(viewType);
  const { data: temporary = [] } = useTemporarilyExcludedProfiles(viewType);
  
  return {
    data: [...permanent, ...temporary],
    isLoading: false,
  };
}

// Get user's like/dislike patterns for smart matching
export function useUserSwipePatterns(viewType: 'profile' | 'listing' = 'profile') {
  return useQuery({
    queryKey: ['swipe-patterns', viewType],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return { liked: [], disliked: [] };

      // NOTE: Using 'as any' because profile_views table is not in auto-generated types
      const { data, error } = await (supabase as any)
        .from('profile_views')
        .select('viewed_profile_id, action')
        .eq('user_id', user.user.id)
        .eq('view_type', viewType)
        .in('action', ['like', 'pass']) as { data: { viewed_profile_id: string; action: string }[] | null; error: any };

      if (error) {
        logger.error('Error fetching swipe patterns:', error);
        return { liked: [], disliked: [] };
      }

      const liked = data?.filter(v => v.action === 'like').map(v => v.viewed_profile_id) || [];
      const disliked = data?.filter(v => v.action === 'pass').map(v => v.viewed_profile_id) || [];

      return { liked, disliked };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get recycled profiles (seen more than 1 day ago - available after next day)
export function useRecycledProfiles(viewType: 'profile' | 'listing' = 'profile') {
  return useQuery({
    queryKey: ['recycled-profiles', viewType],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

      // NOTE: Using 'as any' because profile_views table is not in auto-generated types
      const { data, error } = await (supabase as any)
        .from('profile_views')
        .select('viewed_profile_id, action, created_at')
        .eq('user_id', user.user.id)
        .eq('view_type', viewType)
        .lt('created_at', oneDayAgo) as { data: { viewed_profile_id: string; action: string; created_at: string }[] | null; error: any };

      if (error) {
        logger.error('Error fetching recycled profiles:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
