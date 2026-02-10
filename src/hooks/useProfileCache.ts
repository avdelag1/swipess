import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

interface CachedProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: 'client' | 'owner';
}

/**
 * Performance optimization hook to cache and batch profile fetches
 * Prevents N+1 queries in real-time subscriptions
 */
export function useProfileCache() {
  const queryClient = useQueryClient();

  /**
   * Get a profile from cache or fetch it
   * Uses React Query cache to avoid duplicate fetches
   */
  const getProfile = async (userId: string): Promise<CachedProfile | null> => {
    // Check React Query cache first
    const cacheKey = ['profile', userId];
    const cached = queryClient.getQueryData<CachedProfile>(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch from database with role in a single query
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        return null;
      }

      if (!profile) {
        return null;
      }

      // Fetch role separately (can't join due to RLS)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const cachedProfile: CachedProfile = {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: roleData?.role as 'client' | 'owner' | undefined,
      };

      // Store in cache with 5 minute stale time
      queryClient.setQueryData(cacheKey, cachedProfile, {
        updatedAt: Date.now(),
      });

      return cachedProfile;
    } catch (error) {
      logger.error('Error in getProfile:', error);
      return null;
    }
  };

  /**
   * Batch fetch multiple profiles at once
   * More efficient than individual fetches
   */
  const getProfiles = async (userIds: string[]): Promise<Map<string, CachedProfile>> => {
    const result = new Map<string, CachedProfile>();
    const uncachedIds: string[] = [];

    // Check cache first
    for (const userId of userIds) {
      const cached = queryClient.getQueryData<CachedProfile>(['profile', userId]);
      if (cached) {
        result.set(userId, cached);
      } else {
        uncachedIds.push(userId);
      }
    }

    // Batch fetch uncached profiles
    if (uncachedIds.length > 0) {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', uncachedIds);

        if (error) {
          logger.error('Error batch fetching profiles:', error);
          return result;
        }

        if (profiles) {
          // Batch fetch roles
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', uncachedIds);

          const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

          // Cache and add to result
          for (const profile of profiles) {
            const cachedProfile: CachedProfile = {
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              role: roleMap.get(profile.id) as 'client' | 'owner' | undefined,
            };

            queryClient.setQueryData(['profile', profile.id], cachedProfile);
            result.set(profile.id, cachedProfile);
          }
        }
      } catch (error) {
        logger.error('Error in getProfiles:', error);
      }
    }

    return result;
  };

  return { getProfile, getProfiles };
}
