import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export type OwnerProfile = {
  id?: string;
  user_id: string;
  business_name?: string | null;
  business_description?: string | null; // Text description of the business
  business_location?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  profile_images?: string[] | null;
  verified_owner?: boolean;
  service_offerings?: string[] | null;
};

type OwnerProfileUpdate = Omit<OwnerProfile, 'id' | 'user_id'>;

async function resolveAuthenticatedUserId() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    logger.warn('Session lookup failed during owner profile save:', sessionError.message);
  }

  if (session?.user?.id) {
    return session.user.id;
  }

  // First retry after short delay (handles race conditions during page transitions)
  await new Promise(resolve => setTimeout(resolve, 50));

  const { data: { session: retrySession } } = await supabase.auth.getSession();
  if (retrySession?.user?.id) {
    return retrySession.user.id;
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    logger.warn('User lookup failed during owner profile save:', authError.message);
  }

  if (auth.user?.id) {
    return auth.user.id;
  }

  throw new Error('Auth session missing. Please sign in again.');
}

async function fetchOwnProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('owner_profiles')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error fetching owner profile:', error);
    throw error;
  }

  return data as OwnerProfile | null;
}

export function useOwnerProfile() {
  return useQuery({
    queryKey: ['owner-profile-own'],
    queryFn: fetchOwnProfile,
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000, // 2 minutes - auto-sync keeps data fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: true, // AUTO-SYNC: refresh when user returns to app
  });
}

export function useSaveOwnerProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: OwnerProfileUpdate) => {
      const uid = await resolveAuthenticatedUserId();

      const { data: existing } = await supabase
        .from('owner_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      // Normalize payload: strip undefined values to prevent PostgREST 400s
      const cleanUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      let profileData: OwnerProfile;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('owner_profiles')
          .update(cleanUpdates)
          .eq('user_id', uid)
          .select()
          .single();
        if (error) {
          logger.error('Error updating owner profile:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
          throw new Error(error.message || 'Failed to update owner profile');
        }
        profileData = data as OwnerProfile;
      } else {
        const { data, error } = await supabase
          .from('owner_profiles')
          .insert([{ ...cleanUpdates, user_id: uid }])
          .select()
          .single();
        if (error) {
          logger.error('Error creating owner profile:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
          throw new Error(error.message || 'Failed to create owner profile');
        }
        profileData = data as OwnerProfile;
      }

      // SYNC to profiles table - so owner info shows in messages/public profiles
      const syncPayload: any = {
        updated_at: new Date().toISOString(), // Always mark as updated for sync tracking
      };

      if (updates.profile_images !== undefined) {
        syncPayload.images = updates.profile_images || [];
        if (updates.profile_images && updates.profile_images.length > 0) {
          syncPayload.avatar_url = updates.profile_images[0];
        } else {
          syncPayload.avatar_url = null;
        }
      }

      if (updates.business_name !== undefined) {
        syncPayload.full_name = updates.business_name;
      }

      if (updates.business_description !== undefined) {
        syncPayload.bio = updates.business_description;
      }

      if (updates.business_location !== undefined) {
        syncPayload.city = updates.business_location;
      }

      if (updates.contact_email !== undefined) {
        syncPayload.email = updates.contact_email;
      }

      if (updates.contact_phone !== undefined) {
        syncPayload.phone = updates.contact_phone;
      }

      // Only update if we have real fields to sync (not just updated_at)
      const realSyncKeys = Object.keys(syncPayload).filter(k => k !== 'updated_at');
      if (realSyncKeys.length > 0) {
        try {
          const { error: syncError } = await supabase
            .from('profiles')
            .update(syncPayload)
            .eq('user_id', uid);

          if (syncError) {
            logger.error('[OWNER PROFILE SYNC] Error syncing to profiles:', syncError);
          }
        } catch (syncErr) {
          // Non-blocking: don't let sync failure prevent profile save
          logger.error('[OWNER PROFILE SYNC] Exception:', syncErr);
        }
      }

      return profileData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-profile-own'] });
      qc.invalidateQueries({ queryKey: ['owner-profiles'] });
      qc.invalidateQueries({ queryKey: ['profiles_public'] });
      qc.invalidateQueries({ queryKey: ['topbar-user-profile'] });
    },
  });
}

