import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

/**
 * Type aligned with actual DB columns in client_filter_preferences table.
 * Only the fields listed below persist to DB. Components may set extra fields
 * via the index signature, but they will be silently dropped by insert/update.
 */
export type ClientFilterPreferences = {
  id?: string;
  user_id: string;

  // Price filters (DB columns)
  price_min?: number | null;
  price_max?: number | null;

  // Property preferences (DB columns)
  min_bedrooms?: number | null;
  max_bedrooms?: number | null;
  min_bathrooms?: number | null;
  max_bathrooms?: number | null;
  pet_friendly_required?: boolean | null;
  furnished_required?: boolean | null;
  amenities_required?: any[] | null;
  property_types?: any[] | null;
  location_zones?: any[] | null;

  // Category interests (DB columns)
  preferred_categories?: any[] | null;
  preferred_listing_types?: any[] | null;
  preferred_locations?: any[] | null;
  interested_in_properties?: boolean | null;
  interested_in_motorcycles?: boolean | null;
  interested_in_bicycles?: boolean | null;
  interested_in_vehicles?: boolean | null;

  // Motorcycle preferences (DB columns)
  moto_types?: any[] | null;
  moto_price_min?: number | null;
  moto_price_max?: number | null;
  moto_year_min?: number | null;
  moto_year_max?: number | null;

  // Bicycle preferences (DB columns)
  bicycle_types?: any[] | null;
  bicycle_price_min?: number | null;
  bicycle_price_max?: number | null;

  // Vehicle preferences (DB columns)
  vehicle_types?: any[] | null;
  vehicle_price_min?: number | null;
  vehicle_price_max?: number | null;

  created_at?: string;
  updated_at?: string;

  // Allow extra UI-only fields used by filter components (not persisted)
  [key: string]: any;
};

// Type for database operations (excluding id & user_id)
type ClientFilterPreferencesUpdate = Omit<ClientFilterPreferences, 'id' | 'user_id'>;

async function fetchOwnFilterPreferences() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    logger.error('Error fetching authenticated user:', authError);
    throw authError;
  }
  const uid = auth.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('client_filter_preferences')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data as ClientFilterPreferences | null;
}

export function useClientFilterPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['client-filter-preferences-own'],
    queryFn: fetchOwnFilterPreferences,
  });

  const mutation = useMutation({
    mutationFn: async (updates: ClientFilterPreferencesUpdate) => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.error('Error fetching authenticated user:', authError);
        throw authError;
      }
      const uid = auth.user?.id;
      if (!uid) throw new Error('Not authenticated');

      const { data: existing, error: existingError } = await supabase
        .from('client_filter_preferences')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('Error checking existing filter preferences:', existingError);
        throw existingError;
      }

      if (existing?.id) {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .update(updates as any)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as ClientFilterPreferences;
      } else {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .insert([{ ...updates, user_id: uid } as any])
          .select()
          .single();
        if (error) throw error;
        return data as ClientFilterPreferences;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-filter-preferences-own'] });
    },
  });

  return {
    ...query,
    updatePreferences: mutation.mutateAsync,
    isLoading: query.isLoading || mutation.isPending,
  };
}

export function useSaveClientFilterPreferences() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ClientFilterPreferencesUpdate) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('client_filter_preferences')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .update(updates as any)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as ClientFilterPreferences;
      } else {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .insert([{ ...updates, user_id: uid } as any])
          .select()
          .single();
        if (error) throw error;
        return data as ClientFilterPreferences;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-filter-preferences-own'] });
    },
  });
}


