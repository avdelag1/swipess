/**
 * Profile Auto-Sync Hook
 *
 * Ensures profile data stays fresh for ALL users (new and existing):
 * 1. Listens to Supabase real-time changes on profiles/client_profiles/owner_profiles
 * 2. Refreshes profile queries when the app regains visibility (tab switch, phone unlock)
 * 3. Periodically checks for stale data and re-syncs
 * 4. Ensures new users have their specialized profile row created
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';

// All profile-related query keys that should be refreshed on sync
const PROFILE_QUERY_KEYS = [
  'client-profile-own',
  'owner-profile-own',
  'client-profiles',
  'owner-profiles',
  'profiles_public',
  'client-profile',
];

/**
 * Hook that automatically keeps profile data in sync.
 * Mount this once at the app level (inside AuthProvider).
 */
export function useProfileAutoSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastSyncRef = useRef<number>(0);
  const channelRef = useRef<any>(null);

  // Invalidate all profile-related queries
  const refreshAllProfiles = useCallback(() => {
    const now = Date.now();
    // Throttle: don't refresh more than once every 5 seconds
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;

    logger.log('[ProfileAutoSync] Refreshing all profile data');
    for (const key of PROFILE_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient]);

  // Set up Supabase real-time subscription for profile changes
  useEffect(() => {
    if (!user?.id) return;

    try {
      const channel = supabase
        .channel(`profile-sync-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            logger.log('[ProfileAutoSync] profiles table changed, refreshing');
            refreshAllProfiles();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_profiles',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            logger.log('[ProfileAutoSync] client_profiles changed, refreshing');
            refreshAllProfiles();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'owner_profiles',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            logger.log('[ProfileAutoSync] owner_profiles changed, refreshing');
            refreshAllProfiles();
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (error) {
      logger.error('[ProfileAutoSync] Error setting up realtime sync:', error);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, refreshAllProfiles]);

  // Refresh profiles when app regains visibility (tab switch, phone unlock, app resume)
  useEffect(() => {
    if (!user?.id) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.log('[ProfileAutoSync] App became visible, refreshing profiles');
        refreshAllProfiles();
      }
    };

    // Also handle Capacitor/mobile app resume
    const handleAppResume = () => {
      logger.log('[ProfileAutoSync] App resumed, refreshing profiles');
      refreshAllProfiles();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resume', handleAppResume);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resume', handleAppResume);
    };
  }, [user?.id, refreshAllProfiles]);

  // Periodic sync check every 3 minutes for long-running sessions
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      logger.log('[ProfileAutoSync] Periodic sync check');
      refreshAllProfiles();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, [user?.id, refreshAllProfiles]);
}

/**
 * Ensures new users have their specialized profile row (client_profiles or owner_profiles).
 * This fixes the issue where new users only have a `profiles` entry but no
 * client_profiles/owner_profiles row, causing blank profile pages.
 */
export function useEnsureSpecializedProfile() {
  const { user, initialized } = useAuth();
  const queryClient = useQueryClient();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // CRITICAL: Wait for auth to initialize and ensure user exists
    if (!initialized || !user?.id || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const ensureProfile = async () => {
      try {
        // Determine role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const role = roleData?.role || user.user_metadata?.role;
        if (!role) return;

        // Fetch the user's universal profile for initial data
        const { data: universalProfile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url, age, gender, city, country, neighborhood, interests, bio, nationality, languages_spoken, smoking, work_schedule, lifestyle_tags, images')
          .eq('id', user.id)
          .maybeSingle();

        if (role === 'client') {
          // Check if client_profiles row exists
          const { data: existing } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existing) {
            logger.log('[ProfileAutoSync] Creating missing client_profiles entry for user:', user.id);
            const { error } = await supabase
              .from('client_profiles')
              .insert([{
                user_id: user.id,
                name: universalProfile?.full_name || user.user_metadata?.name || '',
                age: universalProfile?.age || null,
                gender: universalProfile?.gender || null,
                bio: universalProfile?.bio || null,
                city: universalProfile?.city || null,
                country: universalProfile?.country || null,
                neighborhood: universalProfile?.neighborhood || null,
                interests: universalProfile?.interests || [],
                nationality: universalProfile?.nationality || null,
                languages: universalProfile?.languages_spoken || [],
                profile_images: universalProfile?.images || [],
                smoking_habit: universalProfile?.smoking ? 'regularly' : 'never',
                work_schedule: (universalProfile?.work_schedule?.toLowerCase() === 'flexible' ||
                  universalProfile?.work_schedule?.toLowerCase() === 'remote' ||
                  universalProfile?.work_schedule?.toLowerCase() === 'shift')
                  ? universalProfile.work_schedule.toLowerCase() as any
                  : 'regular',
              }]);

            if (error) {
              // Ignore duplicate key errors (race condition protection)
              if (error.code !== '23505') {
                logger.error('[ProfileAutoSync] Failed to create client_profiles:', error);
              }
            } else {
              queryClient.invalidateQueries({ queryKey: ['client-profile-own'] });
              queryClient.invalidateQueries({ queryKey: ['client-profiles'] });
            }
          }
        } else if (role === 'owner') {
          // Check if owner_profiles row exists
          const { data: existing } = await supabase
            .from('owner_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existing) {
            logger.log('[ProfileAutoSync] Creating missing owner_profiles entry for user:', user.id);
            const { error } = await supabase
              .from('owner_profiles')
              .insert([{
                user_id: user.id,
                business_name: universalProfile?.full_name || user.user_metadata?.name || '',
                contact_email: universalProfile?.email || user.email || '',
                profile_images: universalProfile?.images || [],
                business_location: universalProfile?.city || null,
              }]);

            if (error) {
              if (error.code !== '23505') {
                logger.error('[ProfileAutoSync] Failed to create owner_profiles:', error);
              }
            } else {
              queryClient.invalidateQueries({ queryKey: ['owner-profile-own'] });
              queryClient.invalidateQueries({ queryKey: ['owner-profiles'] });
            }
          }
        }
      } catch (error) {
        logger.error('[ProfileAutoSync] Error ensuring specialized profile:', error);
      }
    };

    ensureProfile();
  }, [user?.id, queryClient]);
}
