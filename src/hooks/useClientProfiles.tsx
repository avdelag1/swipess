import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

export interface ClientProfile {
  id: number;
  user_id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  preferred_activities: string[];
  profile_images: string[];
  location: any;
  city?: string;
  avatar_url?: string;
  verified?: boolean;
  client_type?: string[];
  lifestyle_tags?: string[];
  has_pets?: boolean;
  smoking_preference?: string;
  party_friendly?: boolean;
  budget_min?: number;
  budget_max?: number;
  move_in_date?: string;
}

export function useClientProfiles(excludeSwipedIds: string[] = [], options: { enabled?: boolean } = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-profiles', user?.id, excludeSwipedIds],
    enabled: options.enabled !== false,
    queryFn: async (): Promise<ClientProfile[]> => {
      if (!user) {
        return [];
      }

      try {
        // Query profiles table directly - filter by role='client'
        // Only show active profiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            role,
            age,
            gender,
            profile_images,
            interests,
            preferred_activities,
            client_type,
            lifestyle_tags,
            has_pets,
            smoking_preference,
            party_friendly,
            budget_min,
            budget_max,
            move_in_date,
            city,
            is_verified,
            is_active,
            created_at
          `)
          .eq('role', 'client')
          .eq('is_active', true)
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          logger.error('Error fetching client profiles:', error);
          return [];
        }

        if (!profiles || profiles.length === 0) {
          return [];
        }

        // Transform profiles to ClientProfile interface
        const transformed: ClientProfile[] = profiles.map((profile: any, index: number) => ({
          id: index + 1,
          user_id: profile.id,
          name: profile.full_name || 'Anonymous',
          age: profile.age || 25,
          gender: profile.gender || '',
          interests: profile.interests || [],
          preferred_activities: profile.preferred_activities || [],
          profile_images: profile.profile_images || profile.images || [],
          location: profile.city ? { city: profile.city } : null,
          city: profile.city || undefined,
          avatar_url: profile.avatar_url || profile.profile_images?.[0] || undefined,
          verified: profile.is_verified || false,
          client_type: profile.client_type || [],
          lifestyle_tags: profile.lifestyle_tags || [],
          has_pets: profile.has_pets || false,
          smoking_preference: profile.smoking_preference || 'any',
          party_friendly: profile.party_friendly || false,
          budget_min: profile.budget_min || undefined,
          budget_max: profile.budget_max || undefined,
          move_in_date: profile.move_in_date || undefined
        }));

        // Filter out swiped profiles
        return transformed.filter(p => !excludeSwipedIds.includes(p.user_id));

      } catch (error) {
        logger.error('Error fetching client profiles:', error);
        return [];
      }
    },
    // PERF: Longer stale time for profiles since they don't change frequently
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    retry: 2
  });
}

export function useSwipedClientProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-swipes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Query likes table for owner swipes on profiles (clients)
        const { data: ownerLikes, error } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'profile');

        if (error) {
          logger.error('Error fetching owner swipes:', error);
          return [];
        }
        return ownerLikes?.map((l: any) => l.target_id) || [];
      } catch (error) {
        logger.error('Failed to fetch swiped client profiles:', error);
        return [];
      }
    },
    enabled: !!user,
    retry: 2
  });
}
