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
      const [clientData, ownerData] = await Promise.all([
        supabase.from('client_profiles').select('user_id, name, profile_images').eq('user_id', userId).maybeSingle(),
        supabase.from('owner_profiles').select('user_id, business_name, profile_images').eq('user_id', userId).maybeSingle()
      ]);

      if (clientData.error && ownerData.error) {
        logger.error('Error fetching profile:', clientData.error || ownerData.error);
        return null;
      }

      const isClient = !!clientData.data;
      const profile = isClient ? clientData.data : ownerData.data;

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
        id: profile.user_id,
        full_name: isClient ? (profile as any).name : (profile as any).business_name,
        avatar_url: (profile as any).profile_images?.[0],
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
        const [clientData, ownerData] = await Promise.all([
          supabase.from('client_profiles').select('user_id, name, profile_images').in('user_id', uncachedIds),
          supabase.from('owner_profiles').select('user_id, business_name, profile_images').in('user_id', uncachedIds)
        ]);

        if (clientData.error || ownerData.error) {
          logger.error('Error batch fetching profiles:', clientData.error || ownerData.error);
          return result;
        }

        const profiles = [
          ...(clientData.data || []).map(p => ({ ...p, isClient: true })),
          ...(ownerData.data || []).map(p => ({ ...p, isClient: false }))
        ];

        if (profiles.length > 0) {
          // Batch fetch roles
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', uncachedIds);

          const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

          // Cache and add to result
          for (const profile of profiles) {
            const cachedProfile: CachedProfile = {
              id: profile.user_id,
              full_name: profile.isClient ? (profile as any).name : (profile as any).business_name,
              avatar_url: (profile as any).profile_images?.[0],
              role: roleMap.get(profile.user_id) as 'client' | 'owner' | undefined,
            };

            queryClient.setQueryData(['profile', profile.user_id], cachedProfile);
            result.set(profile.user_id, cachedProfile);
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


