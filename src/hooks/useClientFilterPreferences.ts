import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export type ClientFilterPreferences = {
  id?: string;
  user_id: string;

  // Core price filters
  price_min?: number | null;
  price_max?: number | null;

  // Property preferences
  min_bedrooms?: number | null;
  max_bedrooms?: number | null;
  min_bathrooms?: number | null;
  max_bathrooms?: number | null;
  pet_friendly_required?: boolean;
  furnished_required?: boolean;
  amenities_required?: string[] | null;
  property_types?: string[] | null;
  location_zones?: string[] | null;

  // Category interests
  preferred_categories?: string[] | null;
  preferred_listing_types?: string[] | null;
  preferred_locations?: string[] | null;
  interested_in_properties?: boolean;
  interested_in_motorcycles?: boolean;
  interested_in_bicycles?: boolean;
  interested_in_vehicles?: boolean;

  // Motorcycle preferences
  moto_types?: string[] | null;
  moto_price_min?: number | null;
  moto_price_max?: number | null;
  moto_year_min?: number | null;
  moto_year_max?: number | null;

  // Bicycle preferences
  bicycle_types?: string[] | null;
  bicycle_price_min?: number | null;
  bicycle_price_max?: number | null;

  // Vehicle preferences
  vehicle_types?: string[] | null;
  vehicle_price_min?: number | null;
  vehicle_price_max?: number | null;
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
