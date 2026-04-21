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
        // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
        // This is the "Materialized View" strategy: DB handles exclusion in one pass.
        try {
          const { data: rpcClients, error: rpcError } = await (supabase as any).rpc('get_smart_clients', {
            p_user_id: user.id,
            p_limit: 100, // Reasonable first page for feed
            p_offset: 0
          });

          if (!rpcError && rpcClients && Array.isArray(rpcClients) && rpcClients.length > 0) {
            // Transform data (enrichment will happen later in the same way)
            return rpcClients as any[];
          }
          if (rpcError) logger.warn('[ClientProfiles] RPC Error:', rpcError.message);
        } catch (_e) {
          // Fallback to PostgREST
        }

        // 2. BUILD SECURE POSTGREST QUERY (Fallback)
        // 🚀 SPEED OF LIGHT: Unified Join Query
        // One pass. Zero round-trips. Zero client-side enrichment lag.
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`
            user_id, full_name, avatar_url, age, gender, images, 
            interests, lifestyle_tags, smoking, city, country, 
            neighborhood, bio,
            client_profiles (
              name, age, gender, profile_images, bio, interests, nationality, languages
            )
          `)
          .neq('user_id', user.id)
          .eq('role', 'client')
          .eq('is_active', true)
          .eq('onboarding_completed', true)
          .order('created_at', { ascending: false })
          .limit(40); // 🚀 SNAPPY: Fetch just enough for the first 30 seconds of swiping

        if (error) {
          logger.error('[ClientProfiles] Fetch error:', error);
          return [];
        }

        if (!profiles || profiles.length === 0) return [];

        // Transform profiles with zero-latency mapping
        const transformed: ClientProfile[] = profiles.map((p: any, index: number) => {
          const cp = p.client_profiles?.[0]; // Supabase returns joins as arrays
          const profileImages = (p.images?.length > 0) ? p.images : (cp?.profile_images?.length > 0 ? cp.profile_images : []);

          return {
            id: index + 1,
            user_id: p.user_id,
            name: p.full_name || cp?.name || 'New User',
            age: p.age || cp?.age || 0,
            gender: p.gender || cp?.gender || '',
            interests: (p.interests?.length > 0 ? p.interests : cp?.interests) || [],
            preferred_activities: [],
            profile_images: profileImages,
            location: (p.city || cp?.city) ? { city: p.city || cp?.city } : null,
            city: p.city || cp?.city || undefined,
            avatar_url: p.avatar_url || profileImages?.[0] || undefined,
            verified: false,
            client_type: [],
            lifestyle_tags: p.lifestyle_tags || [],
            has_pets: false,
            smoking_preference: p.smoking ? 'yes' : 'any',
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

