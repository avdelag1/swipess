// @ts-nocheck
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
        // FIX: Query only columns that actually exist on the profiles table
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            full_name,
            avatar_url,
            age,
            gender,
            images,
            interests,
            lifestyle_tags,
            smoking,
            city,
            country,
            neighborhood,
            nationality,
            bio,
            created_at
          `)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          logger.error('Error fetching client profiles:', error);
          return [];
        }

        if (!profiles || profiles.length === 0) {
          return [];
        }

        // FIX: Also fetch client_profiles for enrichment (same pattern as useSmartMatching)
        const { data: clientProfileData } = await supabase
          .from('client_profiles')
          .select('user_id, name, age, gender, city, country, profile_images, bio, interests, nationality, languages, neighborhood')
          .limit(200);

        const clientProfileMap = new Map<string, any>();
        if (clientProfileData) {
          for (const cp of clientProfileData) {
            clientProfileMap.set(cp.user_id, cp);
          }
        }

        // Transform profiles to ClientProfile interface with enrichment
        const transformed: ClientProfile[] = profiles.map((profile: any, index: number) => {
          const cpData = clientProfileMap.get(profile.user_id);
          const name = profile.full_name || cpData?.name || 'New User';
          const profileImages = (profile.images && (profile.images as any[]).length > 0)
            ? profile.images
            : (cpData?.profile_images && (cpData.profile_images as any[]).length > 0)
              ? cpData.profile_images
              : [];

          return {
            id: index + 1,
            user_id: profile.user_id,
            name,
            age: profile.age || cpData?.age || 0,
            gender: profile.gender || cpData?.gender || '',
            interests: (profile.interests?.length > 0 ? profile.interests : cpData?.interests) || [],
            preferred_activities: [],
            profile_images: profileImages,
            location: (profile.city || cpData?.city) ? { city: profile.city || cpData?.city } : null,
            city: profile.city || cpData?.city || undefined,
            avatar_url: profile.avatar_url || profileImages?.[0] || undefined,
            verified: false,
            client_type: [],
            lifestyle_tags: profile.lifestyle_tags || [],
            has_pets: false,
            smoking_preference: profile.smoking ? 'yes' : 'any',
            party_friendly: false,
            budget_min: undefined,
            budget_max: undefined,
            move_in_date: undefined
          };
        });

        // Filter out swiped profiles
        return transformed.filter(p => !excludeSwipedIds.includes(p.user_id));

      } catch (error) {
        logger.error('Error fetching client profiles:', error);
        return [];
      }
    },
    // AUTO-SYNC: Shorter stale time so profile updates propagate faster
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: true, // AUTO-SYNC: refresh when user returns to app
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
