export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activation_usage_log: {
        Row: {
          activation_context: string | null
          activation_id: string
          conversation_id: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          activation_context?: string | null
          activation_id: string
          conversation_id?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          activation_context?: string | null
          activation_id?: string
          conversation_id?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_usage_log_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "message_activations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions_log: {
        Row: {
          action_details: Json
          action_type: string
          admin_id: string
          created_at: string
          id: string
          ip_address: unknown
          target_user_id: string
        }
        Insert: {
          action_details: Json
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          target_user_id: string
        }
        Update: {
          action_details?: Json
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          target_user_id?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      admin_dashboard_settings: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          notifications_enabled: boolean | null
          settings: Json | null
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          settings?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          settings?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_user_id: string | null
          created_at: string
          expires_at: string
          id: string
          secret_code: string
          used_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          secret_code: string
          used_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          secret_code?: string
          used_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_cache_control: {
        Row: {
          id: boolean
          version: number | null
        }
        Insert: {
          id?: boolean
          version?: number | null
        }
        Update: {
          id?: boolean
          version?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          details: Json | null
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          details?: Json | null
          id?: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          details?: Json | null
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      best_deal_notifications: {
        Row: {
          created_at: string | null
          id: string
          notifications_available: number | null
          reset_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notifications_available?: number | null
          reset_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notifications_available?: number | null
          reset_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_category_preferences: {
        Row: {
          category: string
          created_at: string | null
          filters: Json
          id: string
          interest_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          filters?: Json
          id?: string
          interest_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          filters?: Json
          id?: string
          interest_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_filter_preferences: {
        Row: {
          amenities_required: string[] | null
          bicycle_types: string[] | null
          created_at: string | null
          floor_level_preference: string | null
          furnished_required: boolean | null
          id: string
          interested_in_vehicles: boolean | null
          lifestyle_tags: string[] | null
          location_zones: string[] | null
          max_bathrooms: number | null
          max_bedrooms: number | null
          max_distance_to_beach: number | null
          max_distance_to_cowork: number | null
          max_price: number | null
          max_size_m2: number | null
          max_transport_budget: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_internet_speed: string | null
          min_parking_spaces: number | null
          min_price: number | null
          min_size_m2: number | null
          motorcycle_types: string[] | null
          needs_bicycle: boolean | null
          needs_motorcycle: boolean | null
          pet_friendly_required: boolean | null
          preferred_lease_end_date: string | null
          preferred_lease_start_date: string | null
          preferred_listing_types: string[] | null
          preferred_pool_types: string[] | null
          preferred_tulum_locations: string[] | null
          preferred_unit_types: string[] | null
          property_types: string[] | null
          rental_duration: string | null
          requires_balcony: boolean | null
          requires_common_areas: boolean | null
          requires_coworking_space: boolean | null
          requires_elevator: boolean | null
          requires_gym: boolean | null
          requires_jacuzzi: boolean | null
          requires_lockoff_unit: boolean | null
          requires_private_rooftop: boolean | null
          requires_security_onsite: boolean | null
          requires_solar_panels: boolean | null
          requires_subletting_allowed: boolean | null
          services_included: string[] | null
          updated_at: string | null
          user_id: string
          vehicle_body_types: string[] | null
          vehicle_comfort_features: string[] | null
          vehicle_condition: string[] | null
          vehicle_drive_types: string[] | null
          vehicle_fuel_types: string[] | null
          vehicle_mileage_max: number | null
          vehicle_number_of_doors: number | null
          vehicle_price_max: number | null
          vehicle_price_min: number | null
          vehicle_safety_features: string[] | null
          vehicle_seating_capacity: number | null
          vehicle_tech_features: string[] | null
          vehicle_transmission: string[] | null
          vehicle_types: string[] | null
          vehicle_year_max: number | null
          vehicle_year_min: number | null
        }
        Insert: {
          amenities_required?: string[] | null
          bicycle_types?: string[] | null
          created_at?: string | null
          floor_level_preference?: string | null
          furnished_required?: boolean | null
          id?: string
          interested_in_vehicles?: boolean | null
          lifestyle_tags?: string[] | null
          location_zones?: string[] | null
          max_bathrooms?: number | null
          max_bedrooms?: number | null
          max_distance_to_beach?: number | null
          max_distance_to_cowork?: number | null
          max_price?: number | null
          max_size_m2?: number | null
          max_transport_budget?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_internet_speed?: string | null
          min_parking_spaces?: number | null
          min_price?: number | null
          min_size_m2?: number | null
          motorcycle_types?: string[] | null
          needs_bicycle?: boolean | null
          needs_motorcycle?: boolean | null
          pet_friendly_required?: boolean | null
          preferred_lease_end_date?: string | null
          preferred_lease_start_date?: string | null
          preferred_listing_types?: string[] | null
          preferred_pool_types?: string[] | null
          preferred_tulum_locations?: string[] | null
          preferred_unit_types?: string[] | null
          property_types?: string[] | null
          rental_duration?: string | null
          requires_balcony?: boolean | null
          requires_common_areas?: boolean | null
          requires_coworking_space?: boolean | null
          requires_elevator?: boolean | null
          requires_gym?: boolean | null
          requires_jacuzzi?: boolean | null
          requires_lockoff_unit?: boolean | null
          requires_private_rooftop?: boolean | null
          requires_security_onsite?: boolean | null
          requires_solar_panels?: boolean | null
          requires_subletting_allowed?: boolean | null
          services_included?: string[] | null
          updated_at?: string | null
          user_id: string
          vehicle_body_types?: string[] | null
          vehicle_comfort_features?: string[] | null
          vehicle_condition?: string[] | null
          vehicle_drive_types?: string[] | null
          vehicle_fuel_types?: string[] | null
          vehicle_mileage_max?: number | null
          vehicle_number_of_doors?: number | null
          vehicle_price_max?: number | null
          vehicle_price_min?: number | null
          vehicle_safety_features?: string[] | null
          vehicle_seating_capacity?: number | null
          vehicle_tech_features?: string[] | null
          vehicle_transmission?: string[] | null
          vehicle_types?: string[] | null
          vehicle_year_max?: number | null
          vehicle_year_min?: number | null
        }
        Update: {
          amenities_required?: string[] | null
          bicycle_types?: string[] | null
          created_at?: string | null
          floor_level_preference?: string | null
          furnished_required?: boolean | null
          id?: string
          interested_in_vehicles?: boolean | null
          lifestyle_tags?: string[] | null
          location_zones?: string[] | null
          max_bathrooms?: number | null
          max_bedrooms?: number | null
          max_distance_to_beach?: number | null
          max_distance_to_cowork?: number | null
          max_price?: number | null
          max_size_m2?: number | null
          max_transport_budget?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_internet_speed?: string | null
          min_parking_spaces?: number | null
          min_price?: number | null
          min_size_m2?: number | null
          motorcycle_types?: string[] | null
          needs_bicycle?: boolean | null
          needs_motorcycle?: boolean | null
          pet_friendly_required?: boolean | null
          preferred_lease_end_date?: string | null
          preferred_lease_start_date?: string | null
          preferred_listing_types?: string[] | null
          preferred_pool_types?: string[] | null
          preferred_tulum_locations?: string[] | null
          preferred_unit_types?: string[] | null
          property_types?: string[] | null
          rental_duration?: string | null
          requires_balcony?: boolean | null
          requires_common_areas?: boolean | null
          requires_coworking_space?: boolean | null
          requires_elevator?: boolean | null
          requires_gym?: boolean | null
          requires_jacuzzi?: boolean | null
          requires_lockoff_unit?: boolean | null
          requires_private_rooftop?: boolean | null
          requires_security_onsite?: boolean | null
          requires_solar_panels?: boolean | null
          requires_subletting_allowed?: boolean | null
          services_included?: string[] | null
          updated_at?: string | null
          user_id?: string
          vehicle_body_types?: string[] | null
          vehicle_comfort_features?: string[] | null
          vehicle_condition?: string[] | null
          vehicle_drive_types?: string[] | null
          vehicle_fuel_types?: string[] | null
          vehicle_mileage_max?: number | null
          vehicle_number_of_doors?: number | null
          vehicle_price_max?: number | null
          vehicle_price_min?: number | null
          vehicle_safety_features?: string[] | null
          vehicle_seating_capacity?: number | null
          vehicle_tech_features?: string[] | null
          vehicle_transmission?: string[] | null
          vehicle_types?: string[] | null
          vehicle_year_max?: number | null
          vehicle_year_min?: number | null
        }
        Relationships: []
      }
      client_preferences_detailed: {
        Row: {
          background_check_completed: boolean | null
          budget_max: number | null
          budget_min: number | null
          communication_style: string | null
          created_at: string | null
          credit_score_range: string | null
          employment_status: string | null
          id: string
          income_documents_provided: boolean | null
          income_verification: boolean | null
          languages_spoken: string[] | null
          lease_duration_preference: string | null
          lifestyle_compatibility: string[] | null
          move_in_flexibility: string | null
          occupation_category: string | null
          party_frequency: string | null
          pet_ownership: boolean | null
          pet_types: string[] | null
          previous_landlord_references: boolean | null
          smoking_preference: string | null
          social_media_verified: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          background_check_completed?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          communication_style?: string | null
          created_at?: string | null
          credit_score_range?: string | null
          employment_status?: string | null
          id?: string
          income_documents_provided?: boolean | null
          income_verification?: boolean | null
          languages_spoken?: string[] | null
          lease_duration_preference?: string | null
          lifestyle_compatibility?: string[] | null
          move_in_flexibility?: string | null
          occupation_category?: string | null
          party_frequency?: string | null
          pet_ownership?: boolean | null
          pet_types?: string[] | null
          previous_landlord_references?: boolean | null
          smoking_preference?: string | null
          social_media_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          background_check_completed?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          communication_style?: string | null
          created_at?: string | null
          credit_score_range?: string | null
          employment_status?: string | null
          id?: string
          income_documents_provided?: boolean | null
          income_verification?: boolean | null
          languages_spoken?: string[] | null
          lease_duration_preference?: string | null
          lifestyle_compatibility?: string[] | null
          move_in_flexibility?: string | null
          occupation_category?: string | null
          party_frequency?: string | null
          pet_ownership?: boolean | null
          pet_types?: string[] | null
          previous_landlord_references?: boolean | null
          smoking_preference?: string | null
          social_media_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          age: number | null
          bio: string | null
          city: string | null
          cleanliness_level: string | null
          country: string | null
          created_at: string | null
          dietary_preferences: string[] | null
          drinking_habit: string | null
          gender: string | null
          has_children: boolean | null
          id: number
          intentions: string[] | null
          interest_categories: string[] | null
          interests: string[] | null
          languages: string[] | null
          latitude: number | null
          lifestyle_tags: string[] | null
          location: Json | null
          longitude: number | null
          name: string | null
          nationality: string | null
          neighborhood: string | null
          noise_tolerance: string | null
          personality_traits: string[] | null
          preferred_activities: string[] | null
          profile_images: string[] | null
          relationship_status: string | null
          smoking_habit: string | null
          updated_at: string | null
          user_id: string | null
          work_schedule: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          city?: string | null
          cleanliness_level?: string | null
          country?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          drinking_habit?: string | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          intentions?: string[] | null
          interest_categories?: string[] | null
          interests?: string[] | null
          languages?: string[] | null
          latitude?: number | null
          lifestyle_tags?: string[] | null
          location?: Json | null
          longitude?: number | null
          name?: string | null
          nationality?: string | null
          neighborhood?: string | null
          noise_tolerance?: string | null
          personality_traits?: string[] | null
          preferred_activities?: string[] | null
          profile_images?: string[] | null
          relationship_status?: string | null
          smoking_habit?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_schedule?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          city?: string | null
          cleanliness_level?: string | null
          country?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          drinking_habit?: string | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          intentions?: string[] | null
          interest_categories?: string[] | null
          interests?: string[] | null
          languages?: string[] | null
          latitude?: number | null
          lifestyle_tags?: string[] | null
          location?: Json | null
          longitude?: number | null
          name?: string | null
          nationality?: string | null
          neighborhood?: string | null
          noise_tolerance?: string | null
          personality_traits?: string[] | null
          preferred_activities?: string[] | null
          profile_images?: string[] | null
          relationship_status?: string | null
          smoking_habit?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_schedule?: string | null
        }
        Relationships: []
      }
      client_services: {
        Row: {
          availability: string | null
          created_at: string
          custom_service_name: string | null
          description: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          service_photos: string[] | null
          service_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          custom_service_name?: string | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          service_photos?: string[] | null
          service_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          custom_service_name?: string | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          service_photos?: string[] | null
          service_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: unknown
          signature_data: string
          signature_type: Database["public"]["Enums"]["signature_type"]
          signed_at: string | null
          signer_id: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: unknown
          signature_data: string
          signature_type: Database["public"]["Enums"]["signature_type"]
          signed_at?: string | null
          signer_id: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: unknown
          signature_data?: string
          signature_type?: Database["public"]["Enums"]["signature_type"]
          signed_at?: string | null
          signer_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "digital_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string
          message_type: string | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text: string
          message_type?: string | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text?: string
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversation_messages_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages_dlq: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string | null
          message_type: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      conversation_starters: {
        Row: {
          conversations_started: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          conversations_started?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          conversations_started?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string | null
          deleted_at: string | null
          free_messaging: boolean | null
          id: string
          last_message: string | null
          last_message_at: string | null
          last_message_sender_id: string | null
          listing_id: string | null
          match_id: string | null
          owner_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deleted_at?: string | null
          free_messaging?: boolean | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_sender_id?: string | null
          listing_id?: string | null
          match_id?: string | null
          owner_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deleted_at?: string | null
          free_messaging?: boolean | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_sender_id?: string | null
          listing_id?: string | null
          match_id?: string | null
          owner_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_match"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          action: string | null
          details: Json | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      database_activity_tracker: {
        Row: {
          accessed_at: string | null
          details: Json | null
          id: number
          operation: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          details?: Json | null
          id?: number
          operation: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          details?: Json | null
          id?: number
          operation?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deal_status_tracking: {
        Row: {
          client_id: string
          completed_at: string | null
          contract_id: string
          created_at: string | null
          id: string
          listing_id: string | null
          owner_id: string
          signed_by_client_at: string | null
          signed_by_owner_at: string | null
          status: Database["public"]["Enums"]["deal_status"] | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          owner_id: string
          signed_by_client_at?: string | null
          signed_by_owner_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          owner_id?: string
          signed_by_client_at?: string | null
          signed_by_owner_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_status_tracking_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "digital_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_contracts: {
        Row: {
          client_id: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          created_by: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          listing_id: string | null
          mime_type: string
          owner_id: string
          status: Database["public"]["Enums"]["deal_status"] | null
          terms_and_conditions: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          listing_id?: string | null
          mime_type?: string
          owner_id: string
          status?: Database["public"]["Enums"]["deal_status"] | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          listing_id?: string | null
          mime_type?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["deal_status"] | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dispute_reports: {
        Row: {
          admin_notes: string | null
          contract_id: string
          created_at: string | null
          description: string
          id: string
          issue_type: string
          priority: string | null
          reported_against: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          contract_id: string
          created_at?: string | null
          description: string
          id?: string
          issue_type: string
          priority?: string | null
          reported_against: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string
          id?: string
          issue_type?: string
          priority?: string | null
          reported_against?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_reports_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "digital_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_document_quota: {
        Row: {
          created_at: string | null
          id: string
          monthly_limit: number | null
          reset_date: string | null
          updated_at: string | null
          used_this_month: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_limit?: number | null
          reset_date?: string | null
          updated_at?: string | null
          used_this_month?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_limit?: number | null
          reset_date?: string | null
          updated_at?: string | null
          used_this_month?: number | null
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          cost: number | null
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          listing_id: string | null
          mime_type: string
          paid_separately: boolean | null
          status: string
          updated_at: string | null
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          listing_id?: string | null
          mime_type: string
          paid_separately?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          listing_id?: string | null
          mime_type?: string
          paid_separately?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          background_check_verified: boolean | null
          baths: number | null
          battery_range: number | null
          beds: number | null
          bicycle_type: string | null
          brake_type: string | null
          category: string | null
          certifications: string[] | null
          city: string | null
          color: string | null
          contacts: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          custom_service_name: string | null
          days_available: string[] | null
          description: string | null
          electric_assist: boolean | null
          engine_cc: number | null
          experience_level: string | null
          experience_years: number | null
          frame_material: string | null
          frame_size: string | null
          fuel_type: string | null
          has_abs: boolean | null
          has_esc: boolean | null
          has_heated_grips: boolean | null
          has_luggage_rack: boolean | null
          has_traction_control: boolean | null
          hourly_rate: number | null
          id: string
          images: string[] | null
          includes_basket: boolean | null
          includes_gear: boolean | null
          includes_helmet: boolean | null
          includes_lights: boolean | null
          includes_lock: boolean | null
          includes_pump: boolean | null
          insurance_verified: boolean | null
          is_active: boolean | null
          latitude: number | null
          license_required: string | null
          likes: number | null
          listing_type: string | null
          location_type: string | null
          longitude: number | null
          mileage: number | null
          minimum_booking_hours: number | null
          motorcycle_type: string | null
          neighborhood: string | null
          number_of_gears: number | null
          offers_emergency_service: boolean | null
          owner_id: string
          price: number | null
          pricing_unit: string | null
          property_type: string | null
          rental_duration_type: string | null
          rental_rates: Json | null
          rules: string[] | null
          schedule_type: string | null
          service_category: string | null
          service_radius_km: number | null
          services_included: string[] | null
          service_type: string | null
          square_footage: number | null
          state: string | null
          status: string | null
          suspension_type: string | null
          time_slots_available: string[] | null
          title: string | null
          tools_equipment: string[] | null
          transmission_type: string | null
          vehicle_brand: string | null
          vehicle_condition: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          video_url: string | null
          views: number | null
          wheel_size: string | null
          work_type: string | null
          worker_skills: string[] | null
          year: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          background_check_verified?: boolean | null
          baths?: number | null
          battery_range?: number | null
          beds?: number | null
          bicycle_type?: string | null
          brake_type?: string | null
          category?: string | null
          certifications?: string[] | null
          city?: string | null
          color?: string | null
          contacts?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_service_name?: string | null
          days_available?: string[] | null
          description?: string | null
          electric_assist?: boolean | null
          engine_cc?: number | null
          experience_level?: string | null
          experience_years?: number | null
          frame_material?: string | null
          frame_size?: string | null
          fuel_type?: string | null
          has_abs?: boolean | null
          has_esc?: boolean | null
          has_heated_grips?: boolean | null
          has_luggage_rack?: boolean | null
          has_traction_control?: boolean | null
          hourly_rate?: number | null
          id?: string
          images?: string[] | null
          includes_basket?: boolean | null
          includes_gear?: boolean | null
          includes_helmet?: boolean | null
          includes_lights?: boolean | null
          includes_lock?: boolean | null
          includes_pump?: boolean | null
          insurance_verified?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          license_required?: string | null
          likes?: number | null
          listing_type?: string | null
          location_type?: string | null
          longitude?: number | null
          mileage?: number | null
          minimum_booking_hours?: number | null
          motorcycle_type?: string | null
          neighborhood?: string | null
          number_of_gears?: number | null
          offers_emergency_service?: boolean | null
          owner_id: string
          price?: number | null
          pricing_unit?: string | null
          property_type?: string | null
          rental_duration_type?: string | null
          rental_rates?: Json | null
          rules?: string[] | null
          schedule_type?: string | null
          service_category?: string | null
          service_radius_km?: number | null
          services_included?: string[] | null
          service_type?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          suspension_type?: string | null
          time_slots_available?: string[] | null
          title?: string | null
          tools_equipment?: string[] | null
          transmission_type?: string | null
          vehicle_brand?: string | null
          vehicle_condition?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          video_url?: string | null
          views?: number | null
          wheel_size?: string | null
          work_type?: string | null
          worker_skills?: string[] | null
          year?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          background_check_verified?: boolean | null
          baths?: number | null
          battery_range?: number | null
          beds?: number | null
          bicycle_type?: string | null
          brake_type?: string | null
          category?: string | null
          certifications?: string[] | null
          city?: string | null
          color?: string | null
          contacts?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_service_name?: string | null
          days_available?: string[] | null
          description?: string | null
          electric_assist?: boolean | null
          engine_cc?: number | null
          experience_level?: string | null
          experience_years?: number | null
          frame_material?: string | null
          frame_size?: string | null
          fuel_type?: string | null
          has_abs?: boolean | null
          has_esc?: boolean | null
          has_heated_grips?: boolean | null
          has_luggage_rack?: boolean | null
          has_traction_control?: boolean | null
          hourly_rate?: number | null
          id?: string
          images?: string[] | null
          includes_basket?: boolean | null
          includes_gear?: boolean | null
          includes_helmet?: boolean | null
          includes_lights?: boolean | null
          includes_lock?: boolean | null
          includes_pump?: boolean | null
          insurance_verified?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          license_required?: string | null
          likes?: number | null
          listing_type?: string | null
          location_type?: string | null
          longitude?: number | null
          mileage?: number | null
          minimum_booking_hours?: number | null
          motorcycle_type?: string | null
          neighborhood?: string | null
          number_of_gears?: number | null
          offers_emergency_service?: boolean | null
          owner_id?: string
          price?: number | null
          pricing_unit?: string | null
          property_type?: string | null
          rental_duration_type?: string | null
          rental_rates?: Json | null
          rules?: string[] | null
          schedule_type?: string | null
          service_category?: string | null
          service_radius_km?: number | null
          services_included?: string[] | null
          service_type?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          suspension_type?: string | null
          time_slots_available?: string[] | null
          title?: string | null
          tools_equipment?: string[] | null
          transmission_type?: string | null
          vehicle_brand?: string | null
          vehicle_condition?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          video_url?: string | null
          views?: number | null
          wheel_size?: string | null
          work_type?: string | null
          worker_skills?: string[] | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_listings_owner_profiles"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_intelligence: {
        Row: {
          crime_rate: number | null
          id: string
          location: unknown
          neighborhood_score: number | null
          property_id: string | null
          walkability_score: number | null
        }
        Insert: {
          crime_rate?: number | null
          id?: string
          location?: unknown
          neighborhood_score?: number | null
          property_id?: string | null
          walkability_score?: number | null
        }
        Update: {
          crime_rate?: number | null
          id?: string
          location?: unknown
          neighborhood_score?: number | null
          property_id?: string | null
          walkability_score?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          listing_id: string | null
          owner_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          owner_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          owner_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_activations: {
        Row: {
          activation_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          remaining_activations: number | null
          reset_date: string | null
          total_activations: number
          updated_at: string | null
          used_activations: number
          user_id: string
        }
        Insert: {
          activation_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          remaining_activations?: number | null
          reset_date?: string | null
          total_activations?: number
          updated_at?: string | null
          used_activations?: number
          user_id: string
        }
        Update: {
          activation_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          remaining_activations?: number | null
          reset_date?: string | null
          total_activations?: number
          updated_at?: string | null
          used_activations?: number
          user_id?: string
        }
        Relationships: []
      }
      mexico_locations: {
        Row: {
          city: string
          created_at: string
          id: string
          neighborhoods: string[] | null
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          neighborhoods?: string[] | null
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          neighborhoods?: string[] | null
          state?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_enabled: boolean | null
          notification_frequency: string | null
          push_enabled: boolean | null
          sms_enabled: boolean | null
          user_id: string
        }
        Insert: {
          email_enabled?: boolean | null
          notification_frequency?: string | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          user_id: string
        }
        Update: {
          email_enabled?: boolean | null
          notification_frequency?: string | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          link_url: string | null
          message: string
          metadata: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          related_match_id: string | null
          related_message_id: string | null
          related_property_id: string | null
          related_user_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          link_url?: string | null
          message: string
          metadata?: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          related_match_id?: string | null
          related_message_id?: string | null
          related_property_id?: string | null
          related_user_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          related_match_id?: string | null
          related_message_id?: string | null
          related_property_id?: string | null
          related_user_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_client_preferences: {
        Row: {
          allows_extra_guests: boolean | null
          allows_parties: boolean | null
          allows_pets: boolean | null
          allows_smoking: boolean | null
          category: string | null
          category_filters: Json | null
          cleanliness_important: boolean | null
          compatible_lifestyle_tags: string[] | null
          created_at: string | null
          id: string
          interest_type: string | null
          languages_spoken: string[] | null
          listing_id: string | null
          max_age: number | null
          max_budget: number | null
          max_extra_guests: number | null
          maximum_stay_days: number | null
          min_age: number | null
          min_budget: number | null
          min_monthly_income: number | null
          minimum_stay_days: number | null
          no_smoking: boolean | null
          preferred_nationalities: string[] | null
          preferred_occupations: string[] | null
          punctual_payments_required: boolean | null
          quiet_hours_required: boolean | null
          requires_employment_proof: boolean | null
          requires_references: boolean | null
          respects_building_rules: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allows_extra_guests?: boolean | null
          allows_parties?: boolean | null
          allows_pets?: boolean | null
          allows_smoking?: boolean | null
          category?: string | null
          category_filters?: Json | null
          cleanliness_important?: boolean | null
          compatible_lifestyle_tags?: string[] | null
          created_at?: string | null
          id?: string
          interest_type?: string | null
          languages_spoken?: string[] | null
          listing_id?: string | null
          max_age?: number | null
          max_budget?: number | null
          max_extra_guests?: number | null
          maximum_stay_days?: number | null
          min_age?: number | null
          min_budget?: number | null
          min_monthly_income?: number | null
          minimum_stay_days?: number | null
          no_smoking?: boolean | null
          preferred_nationalities?: string[] | null
          preferred_occupations?: string[] | null
          punctual_payments_required?: boolean | null
          quiet_hours_required?: boolean | null
          requires_employment_proof?: boolean | null
          requires_references?: boolean | null
          respects_building_rules?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allows_extra_guests?: boolean | null
          allows_parties?: boolean | null
          allows_pets?: boolean | null
          allows_smoking?: boolean | null
          category?: string | null
          category_filters?: Json | null
          cleanliness_important?: boolean | null
          compatible_lifestyle_tags?: string[] | null
          created_at?: string | null
          id?: string
          interest_type?: string | null
          languages_spoken?: string[] | null
          listing_id?: string | null
          max_age?: number | null
          max_budget?: number | null
          max_extra_guests?: number | null
          maximum_stay_days?: number | null
          min_age?: number | null
          min_budget?: number | null
          min_monthly_income?: number | null
          minimum_stay_days?: number | null
          no_smoking?: boolean | null
          preferred_nationalities?: string[] | null
          preferred_occupations?: string[] | null
          punctual_payments_required?: boolean | null
          quiet_hours_required?: boolean | null
          requires_employment_proof?: boolean | null
          requires_references?: boolean | null
          respects_building_rules?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      owner_likes: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_super_like: boolean | null
          listing_id: string | null
          owner_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_super_like?: boolean | null
          listing_id?: string | null
          owner_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_super_like?: boolean | null
          listing_id?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_likes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_likes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_likes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_profiles: {
        Row: {
          business_description: string | null
          business_location: string | null
          business_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          profile_images: string[] | null
          service_offerings: string[] | null
          updated_at: string | null
          user_id: string
          verified_owner: boolean | null
        }
        Insert: {
          business_description?: string | null
          business_location?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          profile_images?: string[] | null
          service_offerings?: string[] | null
          updated_at?: string | null
          user_id: string
          verified_owner?: boolean | null
        }
        Update: {
          business_description?: string | null
          business_location?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          profile_images?: string[] | null
          service_offerings?: string[] | null
          updated_at?: string | null
          user_id?: string
          verified_owner?: boolean | null
        }
        Relationships: []
      }
      package_usage: {
        Row: {
          created_at: string | null
          id: string
          messages_sent_this_week: number | null
          month_start_date: string | null
          package_type: string
          properties_posted_this_month: number | null
          super_likes_used_this_month: number | null
          updated_at: string | null
          user_id: string
          week_start_date: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages_sent_this_week?: number | null
          month_start_date?: string | null
          package_type: string
          properties_posted_this_month?: number | null
          super_likes_used_this_month?: number | null
          updated_at?: string | null
          user_id: string
          week_start_date?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          messages_sent_this_week?: number | null
          month_start_date?: string | null
          package_type?: string
          properties_posted_this_month?: number | null
          super_likes_used_this_month?: number | null
          updated_at?: string | null
          user_id?: string
          week_start_date?: string | null
        }
        Relationships: []
      }
      payment_activations: {
        Row: {
          activated_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          payment_id: string | null
          payment_provider: string | null
          payment_status: string | null
          plan_id: string
          plan_name: string
          price: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          plan_id: string
          plan_name: string
          price: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          plan_id?: string
          plan_name?: string
          price?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_providers: {
        Row: {
          api_key: string | null
          id: string
          is_active: boolean | null
          name: string | null
          webhook_secret: string | null
        }
        Insert: {
          api_key?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          webhook_secret?: string | null
        }
        Update: {
          api_key?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          provider_id: string | null
          status: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      paypal_credentials: {
        Row: {
          client_id: string
          created_at: string
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: never
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: never
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paypal_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: number
          status: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: never
          status: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: never
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          execution_time: number | null
          id: string
          log_time: string
          query: string | null
        }
        Insert: {
          execution_time?: number | null
          id?: string
          log_time?: string
          query?: string | null
        }
        Update: {
          execution_time?: number | null
          id?: string
          log_time?: string
          query?: string | null
        }
        Relationships: []
      }
      profile_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_update_logs: {
        Row: {
          created_at: string | null
          id: number
          update_details: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          update_details: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          update_details?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_mode: string | null
          age: number | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          broker_tier: string | null
          broker_verified: boolean | null
          budget_max: number | null
          budget_min: number | null
          cache_version: number | null
          city: string | null
          country: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          has_pets: boolean | null
          id: string
          images: string[] | null
          interests: string[] | null
          is_active: boolean
          is_banned: boolean | null
          is_blocked: boolean | null
          is_suspended: boolean | null
          languages_spoken: string[] | null
          lifestyle_tags: string[] | null
          nationality: string | null
          neighborhood: string | null
          onboarding_completed: boolean | null
          package: string | null
          party_friendly: boolean | null
          phone: string | null
          profile_photo_url: string | null
          role: string | null
          smoking: boolean | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          verified: boolean | null
          work_schedule: string | null
        }
        Insert: {
          active_mode?: string | null
          age?: number | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          broker_tier?: string | null
          broker_verified?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          cache_version?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_pets?: boolean | null
          id: string
          images?: string[] | null
          interests?: string[] | null
          is_active?: boolean
          is_banned?: boolean | null
          is_blocked?: boolean | null
          is_suspended?: boolean | null
          languages_spoken?: string[] | null
          lifestyle_tags?: string[] | null
          nationality?: string | null
          neighborhood?: string | null
          onboarding_completed?: boolean | null
          package?: string | null
          party_friendly?: boolean | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: string | null
          smoking?: boolean | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verified?: boolean | null
          work_schedule?: string | null
        }
        Update: {
          active_mode?: string | null
          age?: number | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          broker_tier?: string | null
          broker_verified?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          cache_version?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_pets?: boolean | null
          id?: string
          images?: string[] | null
          interests?: string[] | null
          is_active?: boolean
          is_banned?: boolean | null
          is_blocked?: boolean | null
          is_suspended?: boolean | null
          languages_spoken?: string[] | null
          lifestyle_tags?: string[] | null
          nationality?: string | null
          neighborhood?: string | null
          onboarding_completed?: boolean | null
          package?: string | null
          party_friendly?: boolean | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: string | null
          smoking?: boolean | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verified?: boolean | null
          work_schedule?: string | null
        }
        Relationships: []
      }
      push_outbox: {
        Row: {
          attempt_count: number | null
          conversation_message_id: string
          created_at: string | null
          id: string
          last_error: string | null
          max_attempts: number | null
          next_retry_at: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          conversation_message_id: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          payload: Json
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          conversation_message_id?: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_outbox_conversation_message_id_fkey"
            columns: ["conversation_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      push_outbox_dlq: {
        Row: {
          attempt_count: number | null
          conversation_message_id: string | null
          failed_at: string | null
          id: string
          last_error: string | null
          metadata: Json | null
          moved_by: string | null
          original_id: string | null
          payload: Json | null
        }
        Insert: {
          attempt_count?: number | null
          conversation_message_id?: string | null
          failed_at?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json | null
          moved_by?: string | null
          original_id?: string | null
          payload?: Json | null
        }
        Update: {
          attempt_count?: number | null
          conversation_message_id?: string | null
          failed_at?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json | null
          moved_by?: string | null
          original_id?: string | null
          payload?: Json | null
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          identifier: string
        }
        Update: {
          created_at?: string | null
          id?: never
          identifier?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_count: number | null
          action_type: string
          id: number
          last_action_timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action_count?: number | null
          action_type: string
          id?: never
          last_action_timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action_count?: number | null
          action_type?: string
          id?: never
          last_action_timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          accuracy_rating: number | null
          cleanliness_rating: number | null
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          flag_reason: string | null
          helpful_count: number | null
          id: string
          is_flagged: boolean | null
          is_verified_stay: boolean | null
          listing_id: string | null
          location_rating: number | null
          rating: number | null
          responded_at: string | null
          response_text: string | null
          review_title: string | null
          review_type: string | null
          reviewed_id: string | null
          reviewer_id: string | null
          updated_at: string | null
          value_rating: number | null
        }
        Insert: {
          accuracy_rating?: number | null
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          flag_reason?: string | null
          helpful_count?: number | null
          id: string
          is_flagged?: boolean | null
          is_verified_stay?: boolean | null
          listing_id?: string | null
          location_rating?: number | null
          rating?: number | null
          responded_at?: string | null
          response_text?: string | null
          review_title?: string | null
          review_type?: string | null
          reviewed_id?: string | null
          reviewer_id?: string | null
          updated_at?: string | null
          value_rating?: number | null
        }
        Update: {
          accuracy_rating?: number | null
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          flag_reason?: string | null
          helpful_count?: number | null
          id?: string
          is_flagged?: boolean | null
          is_verified_stay?: boolean | null
          listing_id?: string | null
          location_rating?: number | null
          rating?: number | null
          responded_at?: string | null
          response_text?: string | null
          review_title?: string | null
          review_type?: string | null
          reviewed_id?: string | null
          reviewer_id?: string | null
          updated_at?: string | null
          value_rating?: number | null
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          allows_parties: boolean | null
          allows_pets: boolean | null
          allows_smoking: boolean | null
          category: string
          client_types: string[] | null
          created_at: string
          filters: Json
          id: string
          is_active: boolean | null
          lifestyle_tags: string[] | null
          listing_types: string[] | null
          max_age: number | null
          max_budget: number | null
          min_age: number | null
          min_budget: number | null
          min_monthly_income: number | null
          mode: string
          name: string | null
          preferred_occupations: string[] | null
          requires_employment_proof: boolean | null
          requires_references: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allows_parties?: boolean | null
          allows_pets?: boolean | null
          allows_smoking?: boolean | null
          category?: string
          client_types?: string[] | null
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean | null
          lifestyle_tags?: string[] | null
          listing_types?: string[] | null
          max_age?: number | null
          max_budget?: number | null
          min_age?: number | null
          min_budget?: number | null
          min_monthly_income?: number | null
          mode?: string
          name?: string | null
          preferred_occupations?: string[] | null
          requires_employment_proof?: boolean | null
          requires_references?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allows_parties?: boolean | null
          allows_pets?: boolean | null
          allows_smoking?: boolean | null
          category?: string
          client_types?: string[] | null
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean | null
          lifestyle_tags?: string[] | null
          listing_types?: string[] | null
          max_age?: number | null
          max_budget?: number | null
          min_age?: number | null
          min_budget?: number | null
          min_monthly_income?: number | null
          mode?: string
          name?: string | null
          preferred_occupations?: string[] | null
          requires_employment_proof?: boolean | null
          requires_references?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          last_matched_at: string | null
          search_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          last_matched_at?: string | null
          search_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          last_matched_at?: string | null
          search_name?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          id: number
          ip_address: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          id?: never
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          id?: never
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_event_logs: {
        Row: {
          created_at: string | null
          event_details: string
          event_type: string
          id: number
          ip_address: unknown
        }
        Insert: {
          created_at?: string | null
          event_details: string
          event_type: string
          id?: never
          ip_address?: unknown
        }
        Update: {
          created_at?: string | null
          event_details?: string
          event_type?: string
          id?: never
          ip_address?: unknown
        }
        Relationships: []
      }
      service_circuit_breaker: {
        Row: {
          current_failures: number | null
          failure_threshold: number | null
          last_failure_timestamp: string | null
          recovery_strategy: string | null
          service_name: string
        }
        Insert: {
          current_failures?: number | null
          failure_threshold?: number | null
          last_failure_timestamp?: string | null
          recovery_strategy?: string | null
          service_name: string
        }
        Update: {
          current_failures?: number | null
          failure_threshold?: number | null
          last_failure_timestamp?: string | null
          recovery_strategy?: string | null
          service_name?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          advanced_match_tips: boolean | null
          availability_sync: boolean | null
          best_deal_notifications: number | null
          created_at: string | null
          duration_days: number | null
          early_profile_access: boolean | null
          features: Json | null
          id: number
          is_active: boolean | null
          legal_documents_included: number | null
          market_reports: boolean | null
          max_daily_matches: number | null
          max_listings: number | null
          max_property_listings: number | null
          max_property_views: number | null
          message_activations: number | null
          name: string
          package_category: string | null
          paypal_link: string | null
          price: number | null
          seeker_insights: boolean | null
          tier: string | null
        }
        Insert: {
          advanced_match_tips?: boolean | null
          availability_sync?: boolean | null
          best_deal_notifications?: number | null
          created_at?: string | null
          duration_days?: number | null
          early_profile_access?: boolean | null
          features?: Json | null
          id?: never
          is_active?: boolean | null
          legal_documents_included?: number | null
          market_reports?: boolean | null
          max_daily_matches?: number | null
          max_listings?: number | null
          max_property_listings?: number | null
          max_property_views?: number | null
          message_activations?: number | null
          name: string
          package_category?: string | null
          paypal_link?: string | null
          price?: number | null
          seeker_insights?: boolean | null
          tier?: string | null
        }
        Update: {
          advanced_match_tips?: boolean | null
          availability_sync?: boolean | null
          best_deal_notifications?: number | null
          created_at?: string | null
          duration_days?: number | null
          early_profile_access?: boolean | null
          features?: Json | null
          id?: never
          is_active?: boolean | null
          legal_documents_included?: number | null
          market_reports?: boolean | null
          max_daily_matches?: number | null
          max_listings?: number | null
          max_property_listings?: number | null
          max_property_views?: number | null
          message_activations?: number | null
          name?: string
          package_category?: string | null
          paypal_link?: string | null
          price?: number | null
          seeker_insights?: boolean | null
          tier?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          access_client_filters: boolean
          boosted_visibility: boolean
          can_message: boolean
          can_see_who_liked_profile: boolean
          can_see_who_viewed_profile: boolean
          can_superlike: boolean
          created_at: string
          current_likes_made_today: number
          current_messages_made_this_month: number
          current_posts_made: number
          engagement_analytics: boolean
          highlighted_profile: boolean
          id: string
          max_likes_per_day: number
          max_messages_per_month: number
          max_posts_per_month: number
          max_saved_properties: number
          paypal_order_id: string | null
          paypal_subscription_id: string | null
          plan_expiry_date: string | null
          plan_type: string
          premium_filter_badge: boolean
          status: string
          updated_at: string
          user_id: string
          verified_broker: boolean
          visibility_power: number
        }
        Insert: {
          access_client_filters?: boolean
          boosted_visibility?: boolean
          can_message?: boolean
          can_see_who_liked_profile?: boolean
          can_see_who_viewed_profile?: boolean
          can_superlike?: boolean
          created_at?: string
          current_likes_made_today?: number
          current_messages_made_this_month?: number
          current_posts_made?: number
          engagement_analytics?: boolean
          highlighted_profile?: boolean
          id?: string
          max_likes_per_day?: number
          max_messages_per_month?: number
          max_posts_per_month?: number
          max_saved_properties?: number
          paypal_order_id?: string | null
          paypal_subscription_id?: string | null
          plan_expiry_date?: string | null
          plan_type: string
          premium_filter_badge?: boolean
          status?: string
          updated_at?: string
          user_id: string
          verified_broker?: boolean
          visibility_power?: number
        }
        Update: {
          access_client_filters?: boolean
          boosted_visibility?: boolean
          can_message?: boolean
          can_see_who_liked_profile?: boolean
          can_see_who_viewed_profile?: boolean
          can_superlike?: boolean
          created_at?: string
          current_likes_made_today?: number
          current_messages_made_this_month?: number
          current_posts_made?: number
          engagement_analytics?: boolean
          highlighted_profile?: boolean
          id?: string
          max_likes_per_day?: number
          max_messages_per_month?: number
          max_posts_per_month?: number
          max_saved_properties?: number
          paypal_order_id?: string | null
          paypal_subscription_id?: string | null
          plan_expiry_date?: string | null
          plan_type?: string
          premium_filter_badge?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          verified_broker?: boolean
          visibility_power?: number
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          attachment_urls: string[] | null
          category: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          status: string
          subject: string | null
          updated_at: string
          user_email: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      system_trace_logs: {
        Row: {
          child_service: string | null
          error_rate: number | null
          latency_ms: number | null
          parent_service: string | null
          timestamp: string | null
          trace_id: string
        }
        Insert: {
          child_service?: string | null
          error_rate?: number | null
          latency_ms?: number | null
          parent_service?: string | null
          timestamp?: string | null
          trace_id?: string
        }
        Update: {
          child_service?: string | null
          error_rate?: number | null
          latency_ms?: number | null
          parent_service?: string | null
          timestamp?: string | null
          trace_id?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          id: string
          key: string | null
          language_code: string | null
          namespace: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key?: string | null
          language_code?: string | null
          namespace?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string | null
          language_code?: string | null
          namespace?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_action_limits: {
        Row: {
          action: string
          count: number
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          user_id: string
          window_start: string
        }
        Update: {
          action?: string
          count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity_tracking: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_block_list: {
        Row: {
          blocked_user_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          blocked_user_id?: string | null
          created_at?: string | null
          id: string
          user_id?: string | null
        }
        Update: {
          blocked_user_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          block_reason: string | null
          blocked_at: string | null
          blocked_id: string | null
          blocker_id: string | null
          id: number
        }
        Insert: {
          block_reason?: string | null
          blocked_at?: string | null
          blocked_id?: string | null
          blocker_id?: string | null
          id?: never
        }
        Update: {
          block_reason?: string | null
          blocked_at?: string | null
          blocked_id?: string | null
          blocker_id?: string | null
          id?: never
        }
        Relationships: []
      }
      user_complaints: {
        Row: {
          assigned_admin_id: string | null
          complainant_id: string
          complaint_type: string
          conversation_id: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          reported_user_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          assigned_admin_id?: string | null
          complainant_id: string
          complaint_type: string
          conversation_id?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          reported_user_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          assigned_admin_id?: string | null
          complainant_id?: string
          complaint_type?: string
          conversation_id?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          reported_user_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      user_consent_logs: {
        Row: {
          accepted_at: string | null
          consent_type: string | null
          id: string
          ip_address: unknown
          user_id: string | null
          version: string | null
        }
        Insert: {
          accepted_at?: string | null
          consent_type?: string | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
          version?: string | null
        }
        Update: {
          accepted_at?: string | null
          consent_type?: string | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          feedback: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          feedback?: string | null
          id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          feedback?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          sms_notifications: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id: string
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_package_overrides: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          original_package: string | null
          override_package: string
          override_reason: string | null
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          original_package?: string | null
          override_package: string
          override_reason?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          original_package?: string | null
          override_package?: string
          override_reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          created_at: string | null
          id: string
          payment_details: Json | null
          payment_type: string | null
          subscription_package_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          payment_details?: Json | null
          payment_type?: string | null
          subscription_package_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_type?: string | null
          subscription_package_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferred_location: string | null
          preferred_price_range: number[] | null
          preferred_property_type: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          preferred_location?: string | null
          preferred_price_range?: number[] | null
          preferred_property_type?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preferred_location?: string | null
          preferred_price_range?: number[] | null
          preferred_property_type?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_privacy_settings: {
        Row: {
          allow_messages: boolean | null
          created_at: string | null
          id: string
          profile_visibility: string | null
          user_id: string | null
        }
        Insert: {
          allow_messages?: boolean | null
          created_at?: string | null
          id: string
          profile_visibility?: string | null
          user_id?: string | null
        }
        Update: {
          allow_messages?: boolean | null
          created_at?: string | null
          id?: string
          profile_visibility?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription_data: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string | null
          id: string
          report_details: string | null
          report_reason: string
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_details?: string | null
          report_reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          report_details?: string | null
          report_reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      user_restrictions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          restriction_type: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          restriction_type: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          restriction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_search_preferences: {
        Row: {
          accessibility_needs: Json | null
          amenities: Json | null
          created_at: string | null
          id: number
          max_price: number | null
          min_price: number | null
          preferred_locations: Json | null
          property_types: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility_needs?: Json | null
          amenities?: Json | null
          created_at?: string | null
          id?: never
          max_price?: number | null
          min_price?: number | null
          preferred_locations?: Json | null
          property_types?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility_needs?: Json | null
          amenities?: Json | null
          created_at?: string | null
          id?: never
          max_price?: number | null
          min_price?: number | null
          preferred_locations?: Json | null
          property_types?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          notification_preferences: Json | null
          theme: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          notification_preferences?: Json | null
          theme?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          theme?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: number
          is_active: boolean | null
          package_id: number | null
          payment_status: string | null
          start_date: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: never
          is_active?: boolean | null
          package_id?: number | null
          payment_status?: string | null
          start_date?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: never
          is_active?: boolean | null
          package_id?: number | null
          payment_status?: string | null
          start_date?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          acknowledged_at: string | null
          admin_id: string
          created_at: string
          id: string
          message: string
          user_id: string
          warning_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          admin_id: string
          created_at?: string
          id?: string
          message: string
          user_id: string
          warning_type: string
        }
        Update: {
          acknowledged_at?: string | null
          admin_id?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          warning_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      vw_push_outbox_failures: {
        Row: {
          attempt_count: number | null
          conversation_message_id: string | null
          dlq_failed_at: string | null
          dlq_last_error: string | null
          id: string | null
          in_dlq: boolean | null
          last_error: string | null
          max_attempts: number | null
          next_retry_at: string | null
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_outbox_conversation_message_id_fkey"
            columns: ["conversation_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      advanced_property_search: {
        Args: {
          p_accessibility_needs?: Json
          p_amenities?: Json
          p_location?: string
          p_max_price?: number
          p_min_price?: number
          p_page?: number
          p_page_size?: number
          p_property_type?: string
          p_user_id: string
        }
        Returns: {
          amenities: Json
          description: string
          images: Json
          location: string
          price: number
          property_id: number
          property_type: string
          recommendation_score: number
          title: string
        }[]
      }
      archive_inactive_conversations: {
        Args: { p_days_inactive?: number }
        Returns: number
      }
      assign_user_subscription: {
        Args: {
          p_package_name: string
          p_payment_status?: string
          p_transaction_id?: string
          p_user_id: string
        }
        Returns: {
          end_date: string
          package_name: string
          start_date: string
          subscription_id: number
        }[]
      }
      block_user:
        | {
            Args: { p_admin_id: string; p_reason?: string; p_user_id: string }
            Returns: Json
          }
        | {
            Args: { reason?: string; target_user_id: string }
            Returns: boolean
          }
      calculate_advanced_match_score: {
        Args: { property: Json; tenant_profile: Json }
        Returns: number
      }
      calculate_compatibility_score: {
        Args: { client_id: string; owner_id: string }
        Returns: number
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_match_score:
        | {
            Args: { input_text: string; match_threshold: number }
            Returns: number
          }
        | {
            Args: { p_client_id: string; p_listing_id: string }
            Returns: number
          }
        | {
            Args: { p_property_id: number; p_tenant_id: string }
            Returns: number
          }
        | { Args: { property: Json; tenant_profile: Json }; Returns: number }
      can_start_conversation: {
        Args: { p_other_user_id: string; p_user_id: string }
        Returns: boolean
      }
      can_user_perform_action:
        | { Args: never; Returns: boolean }
        | { Args: { p_action: string; p_user_id: string }; Returns: boolean }
      can_view_profile: { Args: { profile_user_id: string }; Returns: boolean }
      cancel_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          cancellation_date: string
          cancelled_subscription_id: number
          package_name: string
        }[]
      }
      change_user_subscription: {
        Args: { p_new_package_name: string; p_user_id: string }
        Returns: {
          change_date: string
          new_package_name: string
          old_package_name: string
        }[]
      }
      check_and_increment_rate_limit: {
        Args: {
          p_action: string
          p_limit: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      check_is_admin: { Args: never; Returns: boolean }
      check_message_activation_required: {
        Args: { p_listing_id: string }
        Returns: boolean
      }
      check_property_availability: {
        Args: {
          p_end_date: string
          p_property_id: number
          p_start_date: string
        }
        Returns: boolean
      }
      check_rate_limit:
        | {
            Args: {
              p_action_type: string
              p_max_actions?: number
              p_time_window?: unknown
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: { max_attempts?: number; user_identifier: string }
            Returns: boolean
          }
      check_user_role_permissions:
        | {
            Args: { p_user_id: string }
            Returns: {
              can_book_property: boolean
              can_create_property: boolean
              can_view_all_properties: boolean
              user_role: string
            }[]
          }
        | {
            Args: { p_required_role: string; p_user_id: string }
            Returns: boolean
          }
      cleanup_old_swipes: { Args: { p_days_old?: number }; Returns: number }
      complete_user_onboarding: {
        Args: { onboarding_data?: Json; user_id: string }
        Returns: undefined
      }
      create_match_if_not_exists:
        | { Args: { a: string; b: string }; Returns: undefined }
        | {
            Args: {
              p_client_id: string
              p_listing_id?: string
              p_owner_id: string
            }
            Returns: undefined
          }
      current_auth_uid: { Args: never; Returns: string }
      current_window_start: {
        Args: { window_seconds: number }
        Returns: string
      }
      deactivate_expired_subscriptions: { Args: never; Returns: undefined }
      delete_user_account: {
        Args: { user_id_to_delete: string }
        Returns: Json
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      flag_stale_listings: {
        Args: { p_days_stale?: number }
        Returns: {
          days_since_update: number
          listing_id: string
          owner_id: string
          title: string
        }[]
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_listings_for_client:
        | {
            Args: never
            Returns: {
              id: number
              name: string
            }[]
          }
        | {
            Args: { client_user_id: string }
            Returns: {
              address: string
              amenities: string[]
              baths: number
              beds: number
              distance_to_beach: number
              distance_to_cenotes: number
              furnished: boolean
              id: string
              images: string[]
              owner_avatar: string
              owner_name: string
              owner_response_time: string
              price: number
              property_description: string
              property_type: string
              rating: number
              square_footage: number
              title: string
              tulum_zone: string
            }[]
          }
      get_all_clients_for_owner: {
        Args: { owner_user_id?: string }
        Returns: {
          age: number
          bio: string
          full_name: string
          id: string
          images: string[]
          interests: string[]
          location: string
          monthly_income: string
          monthly_income_range: string
          name: string
          nationality: string
          occupation: string
          preferences: string[]
          preferred_activities: string[]
          profession: string
          profile_images: string[]
          profile_name: string
          user_id: string
          verified: boolean
        }[]
      }
      get_clients_for_owner: {
        Args: { owner_user_id: string }
        Returns: {
          age: number
          bio: string
          full_name: string
          id: string
          images: string[]
          location: string
          monthly_income: string
          nationality: string
          occupation: string
          verified: boolean
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_effective_user_package: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_listings_for_client: {
        Args: { client_user_id: string }
        Returns: {
          address: string
          baths: number
          beds: number
          city: string
          furnished: boolean
          id: string
          images: string[]
          neighborhood: string
          owner_avatar: string
          owner_name: string
          price: number
          property_type: string
          square_footage: number
          title: string
        }[]
      }
      get_nearby_listings: {
        Args: {
          exclude_owner_id?: string
          radius_km?: number
          user_lat: number
          user_lon: number
        }
        Returns: {
          distance: number
          id: string
          latitude: number
          longitude: number
          owner_id: string
          price: number
          property_type: string
          title: string
        }[]
      }
      get_nearby_profiles: {
        Args: {
          exclude_user_id?: string
          radius_km?: number
          user_lat: number
          user_lon: number
        }
        Returns: {
          distance: number
          full_name: string
          id: string
          latitude: number
          longitude: number
          role: string
        }[]
      }
      get_platform_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_potential_clients_for_owner:
        | { Args: never; Returns: Record<string, unknown>[] }
        | {
            Args: { owner_user_id: string }
            Returns: {
              age: number
              bio: string
              budget: number
              full_name: string
              has_kids: boolean
              has_pets: boolean
              id: string
              images: string[]
              interests: string[]
              location: string
              looking_for: string
              monthly_income_range: string
              move_in_date: string
              nationality: string
              preferences: string[]
              profession: string
              relationship_status: string
              verified: boolean
            }[]
          }
      get_property_recommendations: {
        Args: { p_max_results?: number; p_user_id: string }
        Returns: {
          images: string[]
          match_score: number
          price: number
          property_id: number
          property_type: string
          title: string
        }[]
      }
      get_swipe_feed: {
        Args: { p_category?: string; p_limit?: number; p_user_id: string }
        Returns: {
          already_liked: boolean
          baths: number
          beds: number
          city: string
          description: string
          distance_km: number
          id: string
          images: string[]
          latitude: number
          listing_type: string
          longitude: number
          neighborhood: string
          owner_id: string
          price: number
          property_type: string
          square_footage: number
          title: string
        }[]
      }
      get_swipe_feed_listings: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          city: string
          created_at: string
          id: string
          image: string
          neighborhood: string
          price: number
          title: string
        }[]
      }
      get_swipe_feed_profiles: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
        }[]
      }
      get_swipe_feed_users: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
        }[]
      }
      get_user_like_history: {
        Args: { target_user_id: string }
        Returns: {
          category: string
          like_status: boolean
          liked_at: string
          liker_email: string
          liker_id: string
        }[]
      }
      get_user_like_insights: {
        Args: { target_user_id: string }
        Returns: {
          most_active_liker: string
          most_active_liker_email: string
          most_recent_like: string
          negative_likes: number
          positive_like_percentage: number
          positive_likes: number
          total_likes: number
        }[]
      }
      get_user_subscription_status: {
        Args: { p_user_id: string }
        Returns: {
          end_date: string
          is_active: boolean
          package_name: string
          remaining_daily_matches: number
          remaining_property_listings: number
          start_date: string
          tier: string
        }[]
      }
      get_users_who_liked: {
        Args: { liked_status?: boolean; target_user_id: string }
        Returns: {
          category: string
          liked_at: string
          liker_email: string
          liker_id: string
        }[]
      }
      get_weekly_conversation_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      gettransactionid: { Args: never; Returns: unknown }
      hook_create_profile_on_signup: { Args: { event: Json }; Returns: Json }
      increment_conversation_count: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      increment_review_helpful: {
        Args: { p_review_id: string }
        Returns: undefined
      }
      increment_usage_count:
        | { Args: never; Returns: undefined }
        | { Args: { p_action: string; p_user_id: string }; Returns: undefined }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { c_id: string; u_id: string }
        Returns: boolean
      }
      is_current_user_active: { Args: never; Returns: boolean }
      is_profile_owner: { Args: { profile_user_id: string }; Returns: boolean }
      is_row_active: {
        Args: { deleted_at: string; is_active: boolean }
        Returns: boolean
      }
      is_user_active: { Args: { user_uuid: string }; Returns: boolean }
      is_user_blocked: {
        Args: { potential_blocked_id: string; potential_blocker_id: string }
        Returns: boolean
      }
      log_admin_data_access: {
        Args: { accessed_admin_email: string; accessed_admin_id: string }
        Returns: undefined
      }
      log_profile_update: {
        Args: { update_data: Json; user_id: string }
        Returns: undefined
      }
      log_security_event:
        | {
            Args: { event_details: string; event_type: string }
            Returns: undefined
          }
        | {
            Args: { p_action_details?: Json; p_action_type: string }
            Returns: undefined
          }
      log_user_interaction: {
        Args: {
          p_initiator_id: string
          p_interaction_type: string
          p_property_id?: number
          p_target_id: string
        }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      manage_property_availability:
        | {
            Args: {
              p_blocked_reason?: string
              p_end_date: string
              p_is_available: boolean
              p_property_id: number
              p_start_date: string
            }
            Returns: {
              blocked_reason: string
              end_date: string
              is_available: boolean
              property_id: number
              start_date: string
            }[]
          }
        | {
            Args: {
              p_blocked_reason?: string
              p_end_date: string
              p_is_available: boolean
              p_property_id: string
              p_start_date: string
            }
            Returns: {
              blocked_reason: string
              end_date: string
              is_available: boolean
              property_id: string
              start_date: string
            }[]
          }
      manage_user_ban: {
        Args: { p_admin_id: string; p_is_banned: boolean; p_user_id: string }
        Returns: {
          full_name: string
          new_ban_status: boolean
          previous_ban_status: boolean
          user_id: string
        }[]
      }
      manage_user_verification:
        | {
            Args: {
              p_admin_id: string
              p_user_id: string
              p_verification_status: string
            }
            Returns: {
              full_name: string
              new_status: string
              previous_status: string
              user_id: string
            }[]
          }
        | {
            Args: { p_user_id: string; p_verification_status: string }
            Returns: boolean
          }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      refresh_user_engagement_metrics: { Args: never; Returns: undefined }
      reset_monthly_legal_quotas: { Args: never; Returns: undefined }
      reset_monthly_message_activations: { Args: never; Returns: undefined }
      reset_subscription_usage_counts: { Args: never; Returns: undefined }
      reset_usage_counts: { Args: never; Returns: undefined }
      save_property_recommendations: {
        Args: { p_user_id: string }
        Returns: {
          property_id: number
          recommendation_score: number
        }[]
      }
      search_listings: {
        Args: {
          p_city?: string
          p_limit?: number
          p_listing_type?: string
          p_max_price?: number
          p_min_price?: number
          p_search_query: string
        }
        Returns: {
          city: string
          created_at: string
          description: string
          listing_id: string
          listing_type: string
          owner_id: string
          price: number
          search_rank: number
          title: string
        }[]
      }
      secure_function_template: { Args: { param1: string }; Returns: string }
      send_message: {
        Args: {
          p_content: string
          p_message_type?: string
          p_property_id?: number
          p_receiver_id: string
          p_sender_id: string
        }
        Returns: {
          content: string
          created_at: string
          message_id: number
          receiver_id: string
          sender_id: string
        }[]
      }
      set_secure_search_path: { Args: never; Returns: undefined }
      set_user_role: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: undefined
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      toggle_listing_availability: {
        Args: { p_listing_id: string; p_new_availability: string }
        Returns: undefined
      }
      unblock_user:
        | { Args: { p_admin_id: string; p_user_id: string }; Returns: Json }
        | { Args: { target_user_id: string }; Returns: boolean }
      unlockrows: { Args: { "": string }; Returns: number }
      update_conversation_last_message: {
        Args: { p_conversation_id: number; p_last_message: string }
        Returns: undefined
      }
      update_swipe_analytics: {
        Args: { p_swipe_type: string; p_user_id: string; p_user_role: string }
        Returns: undefined
      }
      update_user_search_preferences: {
        Args: {
          p_accessibility_needs?: Json
          p_amenities?: Json
          p_max_price?: number
          p_min_price?: number
          p_preferred_locations?: Json
          p_property_types?: Json
          p_user_id: string
        }
        Returns: {
          accessibility_needs: Json
          amenities: Json
          max_price: number
          min_price: number
          preferred_locations: Json
          property_types: Json
          user_id: string
        }[]
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      upsert_toggle_owner_like: {
        Args: {
          p_client_id: string
          p_direction: string
          p_listing_id: string
          p_rate_limit_max?: number
          p_rate_limit_window_seconds?: number
        }
        Returns: {
          action: string
          current_likes: number
          like_id: string
          owner_id: string
        }[]
      }
      upsert_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: {
          message: string
          role: string
          success: boolean
          user_id: string
        }[]
      }
      user_has_restriction:
        | { Args: never; Returns: boolean }
        | {
            Args: { p_restriction_type: string; p_user_id: string }
            Returns: boolean
          }
      validate_conversation_message_content: {
        Args: { p_message: string }
        Returns: boolean
      }
      validate_listing_content: { Args: { param1: string }; Returns: boolean }
      validate_listing_content_v2: { Args: never; Returns: undefined }
      validate_user_role_access: {
        Args: { p_required_role: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      contract_type: "lease" | "rental" | "purchase" | "rental_agreement"
      deal_status:
        | "pending"
        | "signed_by_owner"
        | "signed_by_client"
        | "completed"
        | "cancelled"
        | "disputed"
      document_status: "pending" | "approved" | "rejected"
      document_type: "property_deed" | "broker_license" | "id_card" | "other"
      listing_category:
        | "property"
        | "motorcycle"
        | "bicycle"
        | "yacht"
        | "worker"
      listing_status: "active" | "pending" | "inactive" | "suspended"
      listing_type: "rent" | "sale" | "both"
      notification_type:
        | "new_match"
        | "new_message"
        | "new_like"
        | "new_review"
        | "property_inquiry"
        | "contract_signed"
        | "contract_pending"
        | "payment_received"
        | "profile_viewed"
        | "system_announcement"
        | "verification_approved"
        | "subscription_expiring"
      signature_type: "drawn" | "typed" | "uploaded"
      user_role: "client" | "owner" | "admin"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_type: ["lease", "rental", "purchase", "rental_agreement"],
      deal_status: [
        "pending",
        "signed_by_owner",
        "signed_by_client",
        "completed",
        "cancelled",
        "disputed",
      ],
      document_status: ["pending", "approved", "rejected"],
      document_type: ["property_deed", "broker_license", "id_card", "other"],
      listing_category: [
        "property",
        "motorcycle",
        "bicycle",
        "yacht",
        "worker",
      ],
      listing_status: ["active", "pending", "inactive", "suspended"],
      listing_type: ["rent", "sale", "both"],
      notification_type: [
        "new_match",
        "new_message",
        "new_like",
        "new_review",
        "property_inquiry",
        "contract_signed",
        "contract_pending",
        "payment_received",
        "profile_viewed",
        "system_announcement",
        "verification_approved",
        "subscription_expiring",
      ],
      signature_type: ["drawn", "typed", "uploaded"],
      user_role: ["client", "owner", "admin"],
    },
  },
} as const
