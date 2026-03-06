
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export type ClientFilterPreferences = {
  id?: string;
  user_id: string;

  // Property preferences
  min_price?: number | null;
  max_price?: number | null;
  min_bedrooms?: number | null;
  max_bedrooms?: number | null;
  min_bathrooms?: number | null;
  max_bathrooms?: number | null;
  pet_friendly_required?: boolean;
  furnished_required?: boolean;
  rental_duration?: string | null;
  location_zones?: string[] | null;
  property_types?: string[] | null;
  preferred_listing_types?: string[] | null;
  amenities_required?: string[] | null;
  requires_gym?: boolean;
  requires_balcony?: boolean;
  requires_elevator?: boolean;
  requires_jacuzzi?: boolean;
  requires_coworking_space?: boolean;
  requires_solar_panels?: boolean;

  // Category interests
  interested_in_properties?: boolean;
  interested_in_motorcycles?: boolean;
  interested_in_bicycles?: boolean;
  interested_in_yachts?: boolean;
  interested_in_vehicles?: boolean;

  // Motorcycle preferences
  moto_types?: string[] | null;
  moto_engine_size_min?: number | null;
  moto_engine_size_max?: number | null;
  moto_year_min?: number | null;
  moto_year_max?: number | null;
  moto_price_min?: number | null;
  moto_price_max?: number | null;
  moto_mileage_max?: number | null;
  moto_transmission?: string[] | null;
  moto_condition?: string[] | null;
  moto_fuel_types?: string[] | null;
  moto_cylinders?: string[] | null;
  moto_cooling_system?: string[] | null;
  moto_has_abs?: boolean | null;
  moto_features?: string[] | null;
  moto_is_electric?: boolean | null;
  moto_battery_capacity_min?: number | null;

  // Bicycle preferences
  bicycle_types?: string[] | null;
  bicycle_price_min?: number | null;
  bicycle_price_max?: number | null;
  bicycle_wheel_sizes?: string[] | null;
  bicycle_suspension_type?: string[] | null;
  bicycle_material?: string[] | null;
  bicycle_gears_min?: number | null;
  bicycle_gears_max?: number | null;
  bicycle_year_min?: number | null;
  bicycle_condition?: string[] | null;
  bicycle_is_electric?: boolean | null;
  bicycle_battery_range_min?: number | null;

  // Yacht preferences
  yacht_types?: string[] | null;
  yacht_length_min?: number | null;
  yacht_length_max?: number | null;
  yacht_price_min?: number | null;
  yacht_price_max?: number | null;
  yacht_year_min?: number | null;
  yacht_guest_capacity_min?: number | null;
  yacht_guest_capacity_max?: number | null;
  yacht_cabin_count_min?: number | null;
  yacht_cabin_count_max?: number | null;
  yacht_condition?: string[] | null;
  yacht_fuel_types?: string[] | null;
  yacht_engine_power_min?: number | null;
  yacht_engine_power_max?: number | null;
  yacht_max_speed_min?: number | null;
  yacht_range_nm_min?: number | null;
  yacht_hull_material?: string[] | null;
  yacht_water_activities?: string[] | null;
  yacht_navigation_equipment?: string[] | null;
  yacht_has_stabilizers?: boolean | null;

  // Vehicle preferences
  vehicle_types?: string[] | null;
  vehicle_body_types?: string[] | null;
  vehicle_drive_types?: string[] | null;
  vehicle_price_min?: number | null;
  vehicle_price_max?: number | null;
  vehicle_year_min?: number | null;
  vehicle_year_max?: number | null;
  vehicle_mileage_max?: number | null;
  vehicle_transmission?: string[] | null;
  vehicle_fuel_types?: string[] | null;
  vehicle_condition?: string[] | null;
  vehicle_seating_capacity?: number | null;
  vehicle_number_of_doors?: number | null;
  vehicle_safety_features?: string[] | null;
  vehicle_comfort_features?: string[] | null;
  vehicle_tech_features?: string[] | null;
};

// Type for database operations (excluding id)
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

      // Get existing row
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
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as ClientFilterPreferences;
      } else {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .insert([{ ...updates, user_id: uid }])
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

      // Get existing row
      const { data: existing } = await supabase
        .from('client_filter_preferences')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as ClientFilterPreferences;
      } else {
        const { data, error } = await supabase
          .from('client_filter_preferences')
          .insert([{ ...updates, user_id: uid }])
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
