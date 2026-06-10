
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { useAuth } from '@/hooks/useAuth';

export type ClientProfileLite = {
  id?: number;
  user_id: string;
  name?: string | null;
  age?: number | null;
  bio?: string | null;
  gender?: string | null;
  interests?: string[] | null;
  preferred_activities?: string[] | null;
  profile_images?: string[] | null;
  video_url?: string | null;
  // Location fields
  country?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Intentions
  intentions?: string[] | null;
  // Demographic fields
  nationality?: string | null;
  languages?: string[] | null;
  relationship_status?: string | null;
  has_children?: boolean | null;
  // Lifestyle habit fields
  smoking_habit?: string | null;
  drinking_habit?: string | null;
  cleanliness_level?: string | null;
  noise_tolerance?: string | null;
  work_schedule?: string | null;
  // VAP fields
  vap_bio?: string | null;
  vap_occupation?: string | null;
  vap_city?: string | null;
  vap_nationality?: string | null;
  vap_years_in_city?: number | null;
  vap_languages?: string[] | null;
  vap_interests?: string[] | null;
  vap_avatar?: string | null;
  // Cultural and personality fields
  dietary_preferences?: string[] | null;
  personality_traits?: string[] | null;
  interest_categories?: string[] | null;
  // Verification fields
  occupation?: string | null;
  years_in_city?: number | null;
  employer_name?: string | null;
};

// Type for database operations (excluding id)
type ClientProfileUpdate = Omit<ClientProfileLite, 'id' | 'user_id'>;

async function resolveAuthenticatedUserId() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    logger.warn('Session lookup failed during profile save:', sessionError.message);
  }

  if (session?.user?.id) {
    return session.user.id;
  }

  // First retry after short delay (handles race conditions during page transitions)
  const { data: { session: retrySession } } = await supabase.auth.getSession();
  if (retrySession?.user?.id) {
    return retrySession.user.id;
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    logger.warn('User lookup failed during profile save:', authError.message);
  }

  if (auth.user?.id) {
    return auth.user.id;
  }

  throw new Error('Auth session missing. Please sign in again.');
}

async function fetchOwnProfile(uid: string) {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error fetching profile:', error);
    throw error;
  }

  return data as ClientProfileLite | null;
}

export function useClientProfile() {
  // Use the auth context which reads from localStorage synchronously —
  // this avoids the async uid-state effect that was causing a double render / blink.
  const { user } = useAuth();
  const uid = user?.id ?? null;

  return useQuery({
    queryKey: ['client-profile-own', uid],
    queryFn: () => fetchOwnProfile(uid as string),
    enabled: !!uid,
    staleTime: 2 * 60 * 1000, // 2 minutes - auto-sync keeps data fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: true, // AUTO-SYNC: refresh when user returns to app
  });
}

export function useSaveClientProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ClientProfileUpdate) => {
      const uid = await resolveAuthenticatedUserId();

      const { data: existing, error: existingError } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      
      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('Error checking existing profile:', existingError);
        throw existingError;
      }

      // Normalize payload: strip undefined values to prevent PostgREST 400s
      const cleanUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      let profileData: ClientProfileLite;

      if (existing?.id) {
        // Schema retry loop for updates
        let retryCount = 0;
        let currentUpdates = { ...cleanUpdates };
        let successData: any = null;
        let lastError: any = null;

        while (retryCount < 3 && !successData) {
          const { data, error } = await supabase
            .from('client_profiles')
            .update(currentUpdates)
            .eq('user_id', uid)
            .select()
            .single();

          if (error) {
            lastError = error;
            if (error.code === 'PGRST204' || error.code === '42703') {
              const match = error.message.match(/column "([^"]+)"/);
              if (match && match[1]) {
                const badCol = match[1];
                logger.warn(`[ClientProfile] Column ${badCol} missing in DB, stripping and retrying...`);
                delete currentUpdates[badCol];
                retryCount++;
                continue;
              }
            }
            logger.error('Error updating profile:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
            throw new Error(error.message || 'Failed to update profile');
          }
          successData = data;
        }

        if (!successData && lastError) {
           logger.error('Max retries reached for profile update:', lastError);
           throw new Error(lastError.message || 'Failed to update profile after retries');
        }
        profileData = successData as ClientProfileLite;
      } else {
        // Schema retry loop for inserts
        let retryCount = 0;
        let currentInsert = { ...cleanUpdates, user_id: uid };
        let successData: any = null;
        let lastError: any = null;

        while (retryCount < 3 && !successData) {
          const { data, error } = await supabase
            .from('client_profiles')
            .insert([currentInsert])
            .select()
            .single();

          if (error) {
            lastError = error;
            if (error.code === 'PGRST204' || error.code === '42703') {
              const match = error.message.match(/column "([^"]+)"/);
              if (match && match[1]) {
                const badCol = match[1];
                logger.warn(`[ClientProfile] Column ${badCol} missing in DB, stripping and retrying...`);
                delete currentInsert[badCol];
                retryCount++;
                continue;
              }
            }
            logger.error('Error creating profile:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
            throw new Error(error.message || 'Failed to create profile');
          }
          successData = data;
        }

        if (!successData && lastError) {
           logger.error('Max retries reached for profile insert:', lastError);
           throw new Error(lastError.message || 'Failed to create profile after retries');
        }
        profileData = successData as ClientProfileLite;
      }

      // SYNC to profiles table - so owner sees updated data on swipe cards!
      const syncPayload: any = {
        updated_at: new Date().toISOString(), // Always mark as updated for sync tracking
      };

      // Sync images
      if (updates.profile_images !== undefined) {
        syncPayload.images = updates.profile_images || [];
        if (updates.profile_images && updates.profile_images.length > 0) {
          syncPayload.avatar_url = updates.profile_images[0];
        } else {
          syncPayload.avatar_url = null;
        }
      }

      // Sync name → full_name
      if (updates.name !== undefined) {
        syncPayload.full_name = updates.name;
      }

      // Sync age
      if (updates.age !== undefined) {
        syncPayload.age = updates.age;
      }

      // Sync interests
      if (updates.interests !== undefined) {
        syncPayload.interests = updates.interests;
      }

      // Sync gender
      if (updates.gender !== undefined) {
        syncPayload.gender = updates.gender;
      }

      // Sync location fields
      if (updates.country !== undefined) {
        syncPayload.country = updates.country;
      }
      if (updates.city !== undefined) {
        syncPayload.city = updates.city;
      }
      if (updates.neighborhood !== undefined) {
        syncPayload.neighborhood = updates.neighborhood;
      }

      // Sync lifestyle fields so owner swipe cards show full client data
      if (updates.smoking_habit !== undefined) {
        syncPayload.smoking = updates.smoking_habit !== 'Non-Smoker';
      }

      if (updates.nationality !== undefined) {
        syncPayload.nationality = updates.nationality;
      }

      if (updates.languages !== undefined) {
        syncPayload.languages_spoken = updates.languages;
      }

      if (updates.work_schedule !== undefined) {
        syncPayload.work_schedule = updates.work_schedule;
      }

      // Build lifestyle_tags from interests + preferred_activities + personality traits
      const lifestyleTags: string[] = [];
      if (updates.interests) lifestyleTags.push(...updates.interests);
      if (updates.preferred_activities) lifestyleTags.push(...updates.preferred_activities);
      if (updates.personality_traits) lifestyleTags.push(...updates.personality_traits);
      if (lifestyleTags.length > 0) {
        syncPayload.lifestyle_tags = lifestyleTags;
      }

      // Only update if we have real fields to sync (not just updated_at)
      const realSyncKeys = Object.keys(syncPayload).filter(k => k !== 'updated_at');
      if (realSyncKeys.length > 0) {
        try {
          const { data: _syncData, error: syncError } = await supabase
            .from('profiles')
            .update(syncPayload)
            .eq('user_id', uid)
            .select();

          if (syncError) {
            logger.error('[PROFILE SYNC] Error:', syncError);
          } else {
            // Invalidate profiles_public cache immediately after sync
            qc.invalidateQueries({ queryKey: ['profiles_public'] });
          }
        } catch (syncErr) {
          // Non-blocking: don't let sync failure prevent profile save
          logger.error('[PROFILE SYNC] Exception:', syncErr);
        }
      }

      // SYNC to owner_profiles table - so owner sees updated name and avatar!
      const ownerSyncPayload: any = {};
      let hasOwnerSync = false;
      if (updates.name !== undefined) {
        ownerSyncPayload.business_name = updates.name;
        hasOwnerSync = true;
      }
      if (updates.profile_images !== undefined) {
        ownerSyncPayload.profile_images = updates.profile_images || [];
        hasOwnerSync = true;
      }
      
      if (hasOwnerSync) {
        try {
          const { data: _ownerSyncData, error: ownerSyncError } = await supabase
            .from('owner_profiles')
            .update(ownerSyncPayload)
            .eq('user_id', uid)
            .select();

          if (ownerSyncError) {
            logger.error('[OWNER SYNC] Error:', ownerSyncError);
          } else {
            qc.invalidateQueries({ queryKey: ['owner-profile'] });
            qc.invalidateQueries({ queryKey: ['owner-profile', uid] });
            qc.invalidateQueries({ queryKey: ['vap-id-owner-profile', uid] });
          }
        } catch (ownerSyncErr) {
          logger.error('[OWNER SYNC] Exception:', ownerSyncErr);
        }
      }

      return { profileData, uid };
    },
    onSuccess: (_data) => {
      // _data is { profileData, uid }
      const uid = _data.uid;
      qc.invalidateQueries({ queryKey: ['client-profile-own', uid] });
      qc.invalidateQueries({ queryKey: ['client-profile-own'] });
      // Also invalidate owner's view of client profiles
      qc.invalidateQueries({ queryKey: ['client-profiles'] });
      qc.invalidateQueries({ queryKey: ['client-profile'] });
      qc.invalidateQueries({ queryKey: ['owner-profile-own'] });
      qc.invalidateQueries({ queryKey: ['topbar-user-profile'] });
      qc.invalidateQueries({ queryKey: ['vap-id-profile', uid] });
      qc.invalidateQueries({ queryKey: ['vap-id-client-profile', uid] });
    },
  });
}


