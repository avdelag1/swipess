
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

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
  await new Promise(resolve => setTimeout(resolve, 50));

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

async function fetchOwnProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return null;

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
  return useQuery({
    queryKey: ['client-profile-own'],
    queryFn: fetchOwnProfile,
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
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
      const cleanUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      let profileData: ClientProfileLite;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('client_profiles')
          .update(cleanUpdates)
          .eq('user_id', uid)
          .select()
          .single();
        if (error) {
          logger.error('Error updating profile:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
          throw new Error(error.message || 'Failed to update profile');
        }
        profileData = data as ClientProfileLite;
      } else {
        const { data, error } = await supabase
          .from('client_profiles')
          .insert([{ ...cleanUpdates, user_id: uid }])
          .select()
          .single();
        if (error) {
          logger.error('Error creating profile:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
          throw new Error(error.message || 'Failed to create profile');
        }
        profileData = data as ClientProfileLite;
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

      return profileData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-profile-own'] });
      // Also invalidate owner's view of client profiles
      qc.invalidateQueries({ queryKey: ['client-profiles'] });
      qc.invalidateQueries({ queryKey: ['client-profile'] });
      qc.invalidateQueries({ queryKey: ['topbar-user-profile'] });
    },
  });
}

