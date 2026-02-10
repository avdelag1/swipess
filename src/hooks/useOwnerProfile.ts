import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export type OwnerProfile = {
  id?: string;
  user_id: string;
  business_name?: string | null;
  business_description?: string | null;
  business_location?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  profile_images?: string[] | null;
  verified_owner?: boolean;
  service_offerings?: string[] | null;
};

type OwnerProfileUpdate = Omit<OwnerProfile, 'id' | 'user_id'>;

async function fetchOwnProfile() {
  // Use getSession for faster auth check (cached locally)
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
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

export function useSaveOwnerProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: OwnerProfileUpdate) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('owner_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      let profileData: OwnerProfile;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('owner_profiles')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) {
          logger.error('Error updating owner profile:', error);
          throw error;
        }
        profileData = data as OwnerProfile;
      } else {
        const { data, error } = await supabase
          .from('owner_profiles')
          .insert([{ ...updates, user_id: uid }])
          .select()
          .single();
        if (error) {
          logger.error('Error creating owner profile:', error);
          throw error;
        }
        profileData = data as OwnerProfile;
      }

      // SYNC to profiles table - so owner info shows in messages/public profiles
      const syncPayload: any = {};

      if (updates.profile_images !== undefined && updates.profile_images.length > 0) {
        syncPayload.images = updates.profile_images;
      }

      if (updates.business_name !== undefined) {
        syncPayload.full_name = updates.business_name;
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

      // Only update if we have fields to sync
      if (Object.keys(syncPayload).length > 0) {
        const { error: syncError } = await supabase
          .from('profiles')
          .update(syncPayload)
          .eq('id', uid);

        if (syncError) {
          logger.error('[OWNER PROFILE SYNC] Error syncing to profiles:', syncError);
        }
      }

      return profileData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-profile-own'] });
      qc.invalidateQueries({ queryKey: ['owner-profiles'] });
      qc.invalidateQueries({ queryKey: ['profiles_public'] });
    },
  });
}
