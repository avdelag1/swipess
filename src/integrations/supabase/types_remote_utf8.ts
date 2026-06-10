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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      admin_actions_log: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_id: string | null
          created_at: string
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_id?: string | null
          created_at?: string
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_dashboard_settings: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          notifications_enabled: boolean | null
          settings_data: Json | null
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          settings_data?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          settings_data?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string | null
          secret_code: string | null
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          secret_code?: string | null
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          secret_code?: string | null
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          id: string
          last_request_at: string | null
          request_count: number | null
          task_type: string
          user_id: string
        }
        Insert: {
          id?: string
          last_request_at?: string | null
          request_count?: number | null
          task_type: string
          user_id: string
        }
        Update: {
          id?: string
          last_request_at?: string | null
          request_count?: number | null
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      app_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          label_en: string | null
          label_es: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label_en?: string | null
          label_es: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label_en?: string | null
          label_es?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          details: Json | null
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      business_owners: {
        Row: {
          business_id: string | null
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_owners_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "partner_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_promo_submissions: {
        Row: {
          budget_notes: string | null
          business_name: string
          business_type: string
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          owner_name: string
          package: string
          photo_urls: string[] | null
          status: string
          tiktok: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          budget_notes?: string | null
          business_name: string
          business_type: string
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          owner_name: string
          package?: string
          photo_urls?: string[] | null
          status?: string
          tiktok?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          budget_notes?: string | null
          business_name?: string
          business_type?: string
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          owner_name?: string
          package?: string
          photo_urls?: string[] | null
          status?: string
          tiktok?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      business_transactions: {
        Row: {
          business_id: string
          commission_amount: number
          created_at: string
          discount_amount: number
          discount_percentage: number
          id: string
          order_description: string | null
          receipt_photo_url: string | null
          scan_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          business_id: string
          commission_amount?: number
          created_at?: string
          discount_amount?: number
          discount_percentage?: number
          id?: string
          order_description?: string | null
          receipt_photo_url?: string | null
          scan_id?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          business_id?: string
          commission_amount?: number
          created_at?: string
          discount_amount?: number
          discount_percentage?: number
          id?: string
          order_description?: string | null
          receipt_photo_url?: string | null
          scan_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "partner_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_transactions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "qr_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      category_photos: {
        Row: {
          category_id: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
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
      client_profiles: {
        Row: {
          age: number | null
          bio: string | null
          city: string | null
          cleanliness_level: string | null
          country: string | null
          created_at: string
          dietary_preferences: Json | null
          drinking_habit: string | null
          gender: string | null
          has_children: boolean | null
          id: number
          intentions: Json | null
          interest_categories: Json | null
          interests: Json | null
          languages: Json | null
          latitude: number | null
          longitude: number | null
          name: string | null
          nationality: string | null
          neighborhood: string | null
          noise_tolerance: string | null
          personality_traits: Json | null
          preferred_activities: Json | null
          profile_images: Json | null
          relationship_status: string | null
          smoking_habit: string | null
          updated_at: string
          user_id: string
          vap_avatar: string | null
          vap_bio: string | null
          vap_city: string | null
          vap_interests: string[] | null
          vap_languages: string[] | null
          vap_nationality: string | null
          vap_occupation: string | null
          vap_years_in_city: number | null
          work_schedule: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          city?: string | null
          cleanliness_level?: string | null
          country?: string | null
          created_at?: string
          dietary_preferences?: Json | null
          drinking_habit?: string | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          intentions?: Json | null
          interest_categories?: Json | null
          interests?: Json | null
          languages?: Json | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          nationality?: string | null
          neighborhood?: string | null
          noise_tolerance?: string | null
          personality_traits?: Json | null
          preferred_activities?: Json | null
          profile_images?: Json | null
          relationship_status?: string | null
          smoking_habit?: string | null
          updated_at?: string
          user_id: string
          vap_avatar?: string | null
          vap_bio?: string | null
          vap_city?: string | null
          vap_interests?: string[] | null
          vap_languages?: string[] | null
          vap_nationality?: string | null
          vap_occupation?: string | null
          vap_years_in_city?: number | null
          work_schedule?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          city?: string | null
          cleanliness_level?: string | null
          country?: string | null
          created_at?: string
          dietary_preferences?: Json | null
          drinking_habit?: string | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          intentions?: Json | null
          interest_categories?: Json | null
          interests?: Json | null
          languages?: Json | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          nationality?: string | null
          neighborhood?: string | null
          noise_tolerance?: string | null
          personality_traits?: Json | null
          preferred_activities?: Json | null
          profile_images?: Json | null
          relationship_status?: string | null
          smoking_habit?: string | null
          updated_at?: string
          user_id?: string
          vap_avatar?: string | null
          vap_bio?: string | null
          vap_city?: string | null
          vap_interests?: string[] | null
          vap_languages?: string[] | null
          vap_nationality?: string | null
          vap_occupation?: string | null
          vap_years_in_city?: number | null
          work_schedule?: string | null
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          content_text: string
          content_type: string
          created_at: string
          flag_reason: string
          id: string
          resolved_at: string | null
          source_id: string
          status: string
          user_id: string
        }
        Insert: {
          content_text: string
          content_type: string
          created_at?: string
          flag_reason: string
          id?: string
          resolved_at?: string | null
          source_id: string
          status?: string
          user_id: string
        }
        Update: {
          content_text?: string
          content_type?: string
          created_at?: string
          flag_reason?: string
          id?: string
          resolved_at?: string | null
          source_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      content_shares: {
        Row: {
          created_at: string
          id: string
          note: string | null
          share_url: string | null
          shared_via: string | null
          target_id: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          share_url?: string | null
          shared_via?: string | null
          target_id: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          share_url?: string | null
          shared_via?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string | null
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
          content?: string | null
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
          content?: string | null
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
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
          template_type: string | null
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
          template_type?: string | null
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
          template_type?: string | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_digital_contracts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_digital_contracts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_digital_contracts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_digital_contracts_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_redemptions: {
        Row: {
          created_at: string
          id: string
          promotion_id: string | null
          redeemed_at: string
          redemption_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promotion_id?: string | null
          redeemed_at?: string
          redemption_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promotion_id?: string | null
          redeemed_at?: string
          redemption_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_reports: {
        Row: {
          admin_notes: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          id: string
          issue_type: string
          priority: string | null
          reported_against: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: string
          priority?: string | null
          reported_against?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: string
          priority?: string | null
          reported_against?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      event_promote_cards: {
        Row: {
          created_at: string | null
          cta_label: string | null
          cta_url: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          sort_order: number | null
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_story_assets: {
        Row: {
          asset_type: string
          asset_url: string
          caption: string | null
          created_at: string | null
          duration_seconds: number | null
          event_id: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
        }
        Insert: {
          asset_type?: string
          asset_url: string
          caption?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          asset_type?: string
          asset_url?: string
          caption?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          discount_tag: string | null
          event_date: string | null
          event_end_date: string | null
          id: string
          image_url: string | null
          image_urls: Json | null
          is_approved: boolean | null
          is_free: boolean | null
          is_promo: boolean | null
          is_published: boolean | null
          location: string | null
          location_detail: string | null
          organizer_name: string | null
          organizer_photo_url: string | null
          organizer_whatsapp: string | null
          price_text: string | null
          promo_text: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_tag?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          is_approved?: boolean | null
          is_free?: boolean | null
          is_promo?: boolean | null
          is_published?: boolean | null
          location?: string | null
          location_detail?: string | null
          organizer_name?: string | null
          organizer_photo_url?: string | null
          organizer_whatsapp?: string | null
          price_text?: string | null
          promo_text?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_tag?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          is_approved?: boolean | null
          is_free?: boolean | null
          is_promo?: boolean | null
          is_published?: boolean | null
          location?: string | null
          location_detail?: string | null
          organizer_name?: string | null
          organizer_photo_url?: string | null
          organizer_whatsapp?: string | null
          price_text?: string | null
          promo_text?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      expert_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          google_maps_url: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean
          language: string
          location: string | null
          metadata: Json | null
          phone: string | null
          tags: string[] | null
          title: string
          updated_at: string
          website_url: string | null
          whatsapp: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          google_maps_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          language?: string
          location?: string | null
          metadata?: Json | null
          phone?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          google_maps_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          language?: string
          location?: string | null
          metadata?: Json | null
          phone?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      featured_listings: {
        Row: {
          badge: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          listing_id: string
          slot: string
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          listing_id: string
          slot?: string
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string
          slot?: string
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: []
      }
      google_play_transactions: {
        Row: {
          created_at: string | null
          environment: string | null
          id: string
          order_id: string | null
          product_id: string
          purchase_time: string
          purchase_token: string
          raw: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          purchase_time: string
          purchase_token: string
          raw: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          purchase_time?: string
          purchase_token?: string
          raw?: Json
          user_id?: string
        }
        Relationships: []
      }
      lawyer_appointments: {
        Row: {
          appointment_type: string | null
          case_id: string | null
          client_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          lawyer_id: string | null
          location: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          appointment_type?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lawyer_id?: string | null
          location?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          appointment_type?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lawyer_id?: string | null
          location?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_appointments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "lawyer_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "lawyer_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_appointments_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_cases: {
        Row: {
          assigned_package_id: string | null
          case_number: string | null
          category: string
          client_id: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          id: string
          lawyer_id: string | null
          notes: string | null
          opened_at: string | null
          priority: string | null
          source_dispute_id: string | null
          source_report_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_package_id?: string | null
          case_number?: string | null
          category: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lawyer_id?: string | null
          notes?: string | null
          opened_at?: string | null
          priority?: string | null
          source_dispute_id?: string | null
          source_report_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_package_id?: string | null
          case_number?: string | null
          category?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lawyer_id?: string | null
          notes?: string | null
          opened_at?: string | null
          priority?: string | null
          source_dispute_id?: string | null
          source_report_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_cases_assigned_package_id_fkey"
            columns: ["assigned_package_id"]
            isOneToOne: false
            referencedRelation: "legal_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "lawyer_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_cases_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_clients: {
        Row: {
          address: string | null
          app_user_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          lawyer_id: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          app_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          lawyer_id?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          app_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          lawyer_id?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_clients_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "lawyer_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_users: {
        Row: {
          bar_number: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bar_number?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bar_number?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      legal_cases: {
        Row: {
          assigned_to: string | null
          case_number: string
          case_type: string
          created_at: string
          description: string | null
          documents: Json | null
          id: string
          notes: string | null
          parties_involved: Json | null
          priority: string
          related_contract_id: string | null
          related_dispute_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_number: string
          case_type?: string
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          notes?: string | null
          parties_involved?: Json | null
          priority?: string
          related_contract_id?: string | null
          related_dispute_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_number?: string
          case_type?: string
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          notes?: string | null
          parties_involved?: Json | null
          priority?: string
          related_contract_id?: string | null
          related_dispute_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_cases_related_contract_id_fkey"
            columns: ["related_contract_id"]
            isOneToOne: false
            referencedRelation: "digital_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_cases_related_dispute_id_fkey"
            columns: ["related_dispute_id"]
            isOneToOne: false
            referencedRelation: "dispute_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_document_quota: {
        Row: {
          created_at: string
          id: string
          quota_limit: number
          quota_used: number
          reset_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quota_limit?: number
          quota_used?: number
          reset_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quota_limit?: number
          quota_used?: number
          reset_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          body_md: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          body_md?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          body_md?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      legal_service_packages: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_days: number | null
          features: Json | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          cooldown_until: string | null
          created_at: string | null
          direction: string
          dismiss_count: number
          dismissed_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string | null
          direction: string
          dismiss_count?: number
          dismissed_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string | null
          direction?: string
          dismiss_count?: number
          dismissed_at?: string | null
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          background_check_verified: boolean | null
          bathrooms: number | null
          baths: number | null
          battery_range: number | null
          bedrooms: number | null
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
          furnished: boolean | null
          has_abs: boolean | null
          has_esc: boolean | null
          has_heated_grips: boolean | null
          has_luggage_rack: boolean | null
          has_traction_control: boolean | null
          hourly_rate: number | null
          house_rules: string | null
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
          likes: number | null
          listing_type: string | null
          location_type: string | null
          longitude: number | null
          mileage: number | null
          minimum_booking_hours: number | null
          mode: string | null
          motorcycle_type: string | null
          neighborhood: string | null
          number_of_gears: number | null
          offers_emergency_service: boolean | null
          owner_id: string
          pet_friendly: boolean | null
          price: number | null
          pricing_unit: string | null
          property_type: string | null
          rental_duration_type: string | null
          rental_rates: Json | null
          rules: string[] | null
          schedule_type: string | null
          service_category: string | null
          service_radius_km: number | null
          service_type: string | null
          services_included: string[] | null
          skills: Json | null
          square_footage: number | null
          state: string | null
          status: string | null
          suspension_type: string | null
          time_slots_available: string[] | null
          title: string | null
          tools_equipment: string[] | null
          transmission: string | null
          transmission_type: string | null
          updated_at: string
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
          bathrooms?: number | null
          baths?: number | null
          battery_range?: number | null
          bedrooms?: number | null
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
          furnished?: boolean | null
          has_abs?: boolean | null
          has_esc?: boolean | null
          has_heated_grips?: boolean | null
          has_luggage_rack?: boolean | null
          has_traction_control?: boolean | null
          hourly_rate?: number | null
          house_rules?: string | null
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
          likes?: number | null
          listing_type?: string | null
          location_type?: string | null
          longitude?: number | null
          mileage?: number | null
          minimum_booking_hours?: number | null
          mode?: string | null
          motorcycle_type?: string | null
          neighborhood?: string | null
          number_of_gears?: number | null
          offers_emergency_service?: boolean | null
          owner_id: string
          pet_friendly?: boolean | null
          price?: number | null
          pricing_unit?: string | null
          property_type?: string | null
          rental_duration_type?: string | null
          rental_rates?: Json | null
          rules?: string[] | null
          schedule_type?: string | null
          service_category?: string | null
          service_radius_km?: number | null
          service_type?: string | null
          services_included?: string[] | null
          skills?: Json | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          suspension_type?: string | null
          time_slots_available?: string[] | null
          title?: string | null
          tools_equipment?: string[] | null
          transmission?: string | null
          transmission_type?: string | null
          updated_at?: string
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
          bathrooms?: number | null
          baths?: number | null
          battery_range?: number | null
          bedrooms?: number | null
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
          furnished?: boolean | null
          has_abs?: boolean | null
          has_esc?: boolean | null
          has_heated_grips?: boolean | null
          has_luggage_rack?: boolean | null
          has_traction_control?: boolean | null
          hourly_rate?: number | null
          house_rules?: string | null
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
          likes?: number | null
          listing_type?: string | null
          location_type?: string | null
          longitude?: number | null
          mileage?: number | null
          minimum_booking_hours?: number | null
          mode?: string | null
          motorcycle_type?: string | null
          neighborhood?: string | null
          number_of_gears?: number | null
          offers_emergency_service?: boolean | null
          owner_id?: string
          pet_friendly?: boolean | null
          price?: number | null
          pricing_unit?: string | null
          property_type?: string | null
          rental_duration_type?: string | null
          rental_rates?: Json | null
          rules?: string[] | null
          schedule_type?: string | null
          service_category?: string | null
          service_radius_km?: number | null
          service_type?: string | null
          services_included?: string[] | null
          skills?: Json | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          suspension_type?: string | null
          time_slots_available?: string[] | null
          title?: string | null
          tools_equipment?: string[] | null
          transmission?: string | null
          transmission_type?: string | null
          updated_at?: string
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_listings_owner_profiles"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_listings_owner_profiles"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      listings_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          is_cover: boolean | null
          listing_id: string | null
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          listing_id?: string | null
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          listing_id?: string | null
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          category: string
          contract_id: string | null
          created_at: string
          description: string | null
          id: string
          listing_id: string | null
          owner_id: string
          photo_urls: Json | null
          priority: string
          resolved_at: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          owner_id: string
          photo_urls?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          owner_id?: string
          photo_urls?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign_type: string
          channels: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          metrics: Json | null
          name: string
          owner_listings: Json | null
          start_date: string | null
          status: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          campaign_type?: string
          channels?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name: string
          owner_listings?: Json | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          campaign_type?: string
          channels?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          owner_listings?: Json | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
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
          total_activations: number | null
          used_activations: number | null
          user_id: string
        }
        Insert: {
          activation_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          total_activations?: number | null
          used_activations?: number | null
          user_id: string
        }
        Update: {
          activation_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          total_activations?: number | null
          used_activations?: number | null
          user_id?: string
        }
        Relationships: []
      }
      neighborhood_data: {
        Row: {
          avg_rent_price: number | null
          avg_sale_price: number | null
          color_hex: string | null
          created_at: string
          density_score: number | null
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          listing_count: number | null
          longitude: number | null
          name: string
          slug: string
          updated_at: string
          vibe_tags: Json | null
        }
        Insert: {
          avg_rent_price?: number | null
          avg_sale_price?: number | null
          color_hex?: string | null
          created_at?: string
          density_score?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          listing_count?: number | null
          longitude?: number | null
          name: string
          slug: string
          updated_at?: string
          vibe_tags?: Json | null
        }
        Update: {
          avg_rent_price?: number | null
          avg_sale_price?: number | null
          color_hex?: string | null
          created_at?: string
          density_score?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          listing_count?: number | null
          longitude?: number | null
          name?: string
          slug?: string
          updated_at?: string
          vibe_tags?: Json | null
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_client_preferences: {
        Row: {
          created_at: string
          id: string
          max_age: number | null
          max_budget: number | null
          min_age: number | null
          min_budget: number | null
          preferred_nationalities: Json | null
          selected_genders: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_age?: number | null
          max_budget?: number | null
          min_age?: number | null
          min_budget?: number | null
          preferred_nationalities?: Json | null
          selected_genders?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_age?: number | null
          max_budget?: number | null
          min_age?: number | null
          min_budget?: number | null
          preferred_nationalities?: Json | null
          selected_genders?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_profiles: {
        Row: {
          business_description: string | null
          business_location: string | null
          business_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          profile_images: Json | null
          service_offerings: Json | null
          updated_at: string
          user_id: string
          verified_owner: boolean | null
        }
        Insert: {
          business_description?: string | null
          business_location?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          profile_images?: Json | null
          service_offerings?: Json | null
          updated_at?: string
          user_id: string
          verified_owner?: boolean | null
        }
        Update: {
          business_description?: string | null
          business_location?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          profile_images?: Json | null
          service_offerings?: Json | null
          updated_at?: string
          user_id?: string
          verified_owner?: boolean | null
        }
        Relationships: []
      }
      owner_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          package_id: string
          posts_remaining: number | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          package_id: string
          posts_remaining?: number | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          package_id?: string
          posts_remaining?: number | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_subscriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_subscriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_subscriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "premium_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_themes: {
        Row: {
          accent_color: string | null
          background_color: string | null
          body_font: string | null
          density: string | null
          heading_font: string | null
          meta: Json | null
          page_key: string
          primary_color: string | null
          radius: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          density?: string | null
          heading_font?: string | null
          meta?: Json | null
          page_key: string
          primary_color?: string | null
          radius?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          density?: string | null
          heading_font?: string | null
          meta?: Json | null
          page_key?: string
          primary_color?: string | null
          radius?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      partner_businesses: {
        Row: {
          address: string | null
          business_type: string
          commission_rate: number
          created_at: string
          discount_tiers: Json
          email: string | null
          id: string
          instagram: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string
          commission_rate?: number
          created_at?: string
          discount_tiers?: Json
          email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string
          commission_rate?: number
          created_at?: string
          discount_tiers?: Json
          email?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          bucket_id: string
          content_type: string | null
          created_at: string | null
          event_id: string | null
          filename: string | null
          id: string
          metadata: Json | null
          path: string
          processed: boolean | null
          processed_at: string | null
          public: boolean | null
          size: number | null
          storage_path_from: string | null
          storage_path_to: string | null
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          bucket_id?: string
          content_type?: string | null
          created_at?: string | null
          event_id?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          path: string
          processed?: boolean | null
          processed_at?: string | null
          public?: boolean | null
          size?: number | null
          storage_path_from?: string | null
          storage_path_to?: string | null
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          bucket_id?: string
          content_type?: string | null
          created_at?: string | null
          event_id?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          path?: string
          processed?: boolean | null
          processed_at?: string | null
          public?: boolean | null
          size?: number | null
          storage_path_from?: string | null
          storage_path_to?: string | null
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_date: string
          metric_hour: number | null
          new_signups: number | null
          revenue_generated: number | null
          total_active_users: number | null
          total_contracts_signed: number | null
          total_listings_created: number | null
          total_matches: number | null
          total_messages_sent: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date: string
          metric_hour?: number | null
          new_signups?: number | null
          revenue_generated?: number | null
          total_active_users?: number | null
          total_contracts_signed?: number | null
          total_listings_created?: number | null
          total_matches?: number | null
          total_messages_sent?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_hour?: number | null
          new_signups?: number | null
          revenue_generated?: number | null
          total_active_users?: number | null
          total_contracts_signed?: number | null
          total_listings_created?: number | null
          total_matches?: number | null
          total_messages_sent?: number | null
        }
        Relationships: []
      }
      premium_packages: {
        Row: {
          billing_cycle: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          listing_count: number
          month: number
          neighborhood: string
          year: number
        }
        Insert: {
          avg_price: number
          created_at?: string
          id?: string
          listing_count?: number
          month: number
          neighborhood: string
          year: number
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          listing_count?: number
          month?: number
          neighborhood?: string
          year?: number
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          action: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          view_type: string
          viewed_profile_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          view_type: string
          viewed_profile_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          view_type?: string
          viewed_profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_mode: string | null
          age: number | null
          avatar: string | null
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
          profile_images: string[] | null
          profile_photo_url: string | null
          radio_current_station_id: string | null
          radio_is_powered_on: boolean | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
          work_schedule: string | null
        }
        Insert: {
          active_mode?: string | null
          age?: number | null
          avatar?: string | null
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
          profile_images?: string[] | null
          profile_photo_url?: string | null
          radio_current_station_id?: string | null
          radio_is_powered_on?: boolean | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          work_schedule?: string | null
        }
        Update: {
          active_mode?: string | null
          age?: number | null
          avatar?: string | null
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
          profile_images?: string[] | null
          profile_photo_url?: string | null
          radio_current_station_id?: string | null
          radio_is_powered_on?: boolean | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          work_schedule?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applies_to: string | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          free_activations: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          promotion_type: string
          title: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applies_to?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          free_activations?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          promotion_type?: string
          title: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applies_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          free_activations?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          promotion_type?: string
          title?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_outbox: {
        Row: {
          attempts: number | null
          badge: string | null
          body: string | null
          conversation_id: string | null
          conversation_message_id: string | null
          created_at: string
          data: Json | null
          error: string | null
          icon: string | null
          id: string
          image: string | null
          last_attempted_at: string | null
          message: string | null
          notification_type: string | null
          payload: Json | null
          priority: string | null
          processed_at: string | null
          related_user_id: string | null
          scheduled_at: string | null
          status: string | null
          tag: string | null
          title: string | null
          ttl: number | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          badge?: string | null
          body?: string | null
          conversation_id?: string | null
          conversation_message_id?: string | null
          created_at?: string
          data?: Json | null
          error?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          last_attempted_at?: string | null
          message?: string | null
          notification_type?: string | null
          payload?: Json | null
          priority?: string | null
          processed_at?: string | null
          related_user_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          tag?: string | null
          title?: string | null
          ttl?: number | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          badge?: string | null
          body?: string | null
          conversation_id?: string | null
          conversation_message_id?: string | null
          created_at?: string
          data?: Json | null
          error?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          last_attempted_at?: string | null
          message?: string | null
          notification_type?: string | null
          payload?: Json | null
          priority?: string | null
          processed_at?: string | null
          related_user_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          tag?: string | null
          title?: string | null
          ttl?: number | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_token: string | null
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_token?: string | null
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_token?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_templates: {
        Row: {
          body_en: string | null
          body_es: string | null
          channel: string
          is_active: boolean
          key: string
          meta: Json | null
          title_en: string | null
          title_es: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_en?: string | null
          body_es?: string | null
          channel?: string
          is_active?: boolean
          key: string
          meta?: Json | null
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_en?: string | null
          body_es?: string | null
          channel?: string
          is_active?: boolean
          key?: string
          meta?: Json | null
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      qr_scans: {
        Row: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          scan_timestamp: string
          scanned_by: string | null
          scanned_user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          notes?: string | null
          scan_timestamp?: string
          scanned_by?: string | null
          scanned_user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          scan_timestamp?: string
          scanned_by?: string | null
          scanned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "partner_businesses"
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
        Relationships: [
          {
            foreignKeyName: "fk_reviews_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_reviewer"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_reviewer"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_reviewer"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          filter_data: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string
          filter_data?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          user_role?: string
        }
        Update: {
          created_at?: string
          filter_data?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content_type: string
          created_at: string
          draft_image_url: string | null
          draft_meta: Json | null
          draft_text_value: string | null
          id: string
          image_url: string | null
          is_published: boolean
          is_visible: boolean
          locale: string
          meta: Json | null
          page_key: string
          section_key: string
          text_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_type?: string
          created_at?: string
          draft_image_url?: string | null
          draft_meta?: Json | null
          draft_text_value?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          is_visible?: boolean
          locale?: string
          meta?: Json | null
          page_key: string
          section_key: string
          text_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          draft_image_url?: string | null
          draft_meta?: Json | null
          draft_text_value?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          is_visible?: boolean
          locale?: string
          meta?: Json | null
          page_key?: string
          section_key?: string
          text_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_content_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          page_key: string
          section_key: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_key: string
          section_key: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_key?: string
          section_key?: string
          snapshot?: Json
        }
        Relationships: []
      }
      social_media_requests: {
        Row: {
          assigned_to: string | null
          content: string | null
          created_at: string
          id: string
          images: Json | null
          listing_id: string | null
          owner_id: string
          package_id: string | null
          platforms: Json | null
          post_links: Json | null
          posted_at: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          content?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          listing_id?: string | null
          owner_id: string
          package_id?: string | null
          platforms?: Json | null
          post_links?: Json | null
          posted_at?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          content?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          listing_id?: string | null
          owner_id?: string
          package_id?: string | null
          platforms?: Json | null
          post_links?: Json | null
          posted_at?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "premium_packages"
            referencedColumns: ["id"]
          },
        ]
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
          billing_cycle: string | null
          created_at: string | null
          description: string | null
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
          price_cents: number | null
          seeker_insights: boolean | null
          tier: string | null
        }
        Insert: {
          advanced_match_tips?: boolean | null
          availability_sync?: boolean | null
          best_deal_notifications?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
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
          price_cents?: number | null
          seeker_insights?: boolean | null
          tier?: string | null
        }
        Update: {
          advanced_match_tips?: boolean | null
          availability_sync?: boolean | null
          best_deal_notifications?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
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
          price_cents?: number | null
          seeker_insights?: boolean | null
          tier?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_email: string
          user_id: string
          user_role: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_email: string
          user_id: string
          user_role: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      swipe_quick_filters: {
        Row: {
          badge_color: string | null
          category: string
          created_at: string
          filter: Json
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string
          position: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          category?: string
          created_at?: string
          filter?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label: string
          position?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          category?: string
          created_at?: string
          filter?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          position?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      swipe_rules: {
        Row: {
          config: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
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
      tokens: {
        Row: {
          activation_type: string | null
          amount: number | null
          expires_at: string | null
          id: string
          notes: string | null
          remaining_activations: number | null
          reset_date: string | null
          source: string | null
          token: string
          token_type: string | null
          total_activations: number | null
          used_activations: number | null
          user_id: string | null
        }
        Insert: {
          activation_type?: string | null
          amount?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          remaining_activations?: number | null
          reset_date?: string | null
          source?: string | null
          token: string
          token_type?: string | null
          total_activations?: number | null
          used_activations?: number | null
          user_id?: string | null
        }
        Update: {
          activation_type?: string | null
          amount?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          remaining_activations?: number | null
          reset_date?: string | null
          source?: string | null
          token?: string
          token_type?: string | null
          total_activations?: number | null
          used_activations?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      trump_game_scores: {
        Row: {
          background: string | null
          combo: number
          created_at: string
          id: string
          score: number
          user_id: string | null
          weapon_used: string | null
        }
        Insert: {
          background?: string | null
          combo?: number
          created_at?: string
          id?: string
          score?: number
          user_id?: string | null
          weapon_used?: string | null
        }
        Update: {
          background?: string | null
          combo?: number
          created_at?: string
          id?: string
          score?: number
          user_id?: string | null
          weapon_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trump_game_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trump_game_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trump_game_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          block_reason: string | null
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          block_reason?: string | null
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          block_reason?: string | null
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_memories: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          source: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          id?: string
          source?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          source?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
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
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_excluding_caller"
            referencedColumns: ["id"]
          },
        ]
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
      user_visual_preferences: {
        Row: {
          created_at: string
          id: string
          language: string | null
          radio_current_station_id: string | null
          swipe_sound_theme: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          radio_current_station_id?: string | null
          swipe_sound_theme?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          radio_current_station_id?: string | null
          swipe_sound_theme?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vap_id_cards: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          interests: string[] | null
          languages: string[] | null
          name: string | null
          nationality: string | null
          occupation: string | null
          updated_at: string
          user_id: string
          years_in_city: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          name?: string | null
          nationality?: string | null
          occupation?: string | null
          updated_at?: string
          user_id: string
          years_in_city?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          name?: string | null
          nationality?: string | null
          occupation?: string | null
          updated_at?: string
          user_id?: string
          years_in_city?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      app_users: {
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
          id: string | null
          images: string[] | null
          interests: string[] | null
          is_active: boolean | null
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
          profile_images: string[] | null
          profile_photo_url: string | null
          radio_current_station_id: string | null
          radio_is_powered_on: boolean | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
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
          id?: string | null
          images?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
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
          profile_images?: string[] | null
          profile_photo_url?: string | null
          radio_current_station_id?: string | null
          radio_is_powered_on?: boolean | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
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
          id?: string | null
          images?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
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
          profile_images?: string[] | null
          profile_photo_url?: string | null
          radio_current_station_id?: string | null
          radio_is_powered_on?: boolean | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          work_schedule?: string | null
        }
        Relationships: []
      }
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
      other_profiles: {
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
          id: string | null
          images: string[] | null
          interests: string[] | null
          is_active: boolean | null
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
          profile_images: string[] | null
          profile_photo_url: string | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          verified: boolean | null
          work_schedule: string | null
        }
        Relationships: []
      }
      profiles_excluding_caller: {
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
          id: string | null
          images: string[] | null
          interests: string[] | null
          is_active: boolean | null
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
          profile_images: string[] | null
          profile_photo_url: string | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
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
          id?: string | null
          images?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
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
          profile_images?: string[] | null
          profile_photo_url?: string | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
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
          id?: string | null
          images?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
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
          profile_images?: string[] | null
          profile_photo_url?: string | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verified?: boolean | null
          work_schedule?: string | null
        }
        Relationships: []
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
      admin_toggle_premium: {
        Args: { p_package_id?: number; p_target_user_id: string }
        Returns: undefined
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
      check_email_exists: { Args: { p_email: string }; Returns: Json }
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
              p_time_window?: string
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
      get_business_id_for_user: { Args: { p_user_id: string }; Returns: string }
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
      get_other_profiles: {
        Args: never
        Returns: {
          active_mode: string | null
          age: number | null
          avatar: string | null
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
          profile_images: string[] | null
          profile_photo_url: string | null
          radio_current_station_id: string | null
          radio_is_powered_on: boolean | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
          work_schedule: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
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
      get_site_content: {
        Args: { p_page_key?: string }
        Returns: {
          content_type: string
          id: string
          image_url: string
          meta: Json
          page_key: string
          section_key: string
          text_value: string
          updated_at: string
        }[]
      }
      get_smart_clients: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          active_mode: string | null
          age: number | null
          avatar: string | null
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
          profile_images: string[] | null
          profile_photo_url: string | null
          radio_current_station_id: string | null
          radio_is_powered_on: boolean | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
          work_schedule: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_smart_events: {
        Args: { p_category?: string; p_limit?: number; p_user_id?: string }
        Returns: {
          category: string | null
          created_at: string | null
          description: string | null
          discount_tag: string | null
          event_date: string | null
          event_end_date: string | null
          id: string
          image_url: string | null
          image_urls: Json | null
          is_approved: boolean | null
          is_free: boolean | null
          is_promo: boolean | null
          is_published: boolean | null
          location: string | null
          location_detail: string | null
          organizer_name: string | null
          organizer_photo_url: string | null
          organizer_whatsapp: string | null
          price_text: string | null
          promo_text: string | null
          title: string
          video_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_smart_listings: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_user_id: string
        }
        Returns: {
          address: string | null
          amenities: string[] | null
          background_check_verified: boolean | null
          bathrooms: number | null
          baths: number | null
          battery_range: number | null
          bedrooms: number | null
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
          furnished: boolean | null
          has_abs: boolean | null
          has_esc: boolean | null
          has_heated_grips: boolean | null
          has_luggage_rack: boolean | null
          has_traction_control: boolean | null
          hourly_rate: number | null
          house_rules: string | null
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
          likes: number | null
          listing_type: string | null
          location_type: string | null
          longitude: number | null
          mileage: number | null
          minimum_booking_hours: number | null
          mode: string | null
          motorcycle_type: string | null
          neighborhood: string | null
          number_of_gears: number | null
          offers_emergency_service: boolean | null
          owner_id: string
          pet_friendly: boolean | null
          price: number | null
          pricing_unit: string | null
          property_type: string | null
          rental_duration_type: string | null
          rental_rates: Json | null
          rules: string[] | null
          schedule_type: string | null
          service_category: string | null
          service_radius_km: number | null
          service_type: string | null
          services_included: string[] | null
          skills: Json | null
          square_footage: number | null
          state: string | null
          status: string | null
          suspension_type: string | null
          time_slots_available: string[] | null
          title: string | null
          tools_equipment: string[] | null
          transmission: string | null
          transmission_type: string | null
          updated_at: string
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
        }[]
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: false
          isSetofReturn: true
        }
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
      has_admin_role: { Args: { check_role: string }; Returns: boolean }
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
      is_admin_profile: { Args: { profile_id: string }; Returns: boolean }
      is_admin_user: { Args: { check_user_id: string }; Returns: boolean }
      is_business_owner: { Args: { p_user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_current_user_active: { Args: never; Returns: boolean }
      is_lawyer_user: { Args: never; Returns: boolean }
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
      mark_photo_processed: {
        Args: {
          p_event_id: string
          p_photo_id: string
          p_storage_path_to: string
        }
        Returns: undefined
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
      rpc_create_match: {
        Args: { p_client_id: string; p_listing_id?: string; p_owner_id: string }
        Returns: {
          id: string
          matched_at: string
          status: string
        }[]
      }
      rpc_deduct_token: {
        Args: { p_amount?: number; p_token_type?: string }
        Returns: {
          remaining_balance: number
          success: boolean
        }[]
      }
      rpc_get_user_tokens: {
        Args: never
        Returns: {
          total_credits: number
          total_messages: number
          user_id: string
        }[]
      }
      rpc_send_message: {
        Args: { p_conversation_id: string; p_message_text: string }
        Returns: {
          created_at: string
          id: string
        }[]
      }
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
      start_conversation_with_message: {
        Args: {
          p_initial_message: string
          p_listing_id?: string
          p_other_user_id: string
        }
        Returns: {
          conversation_id: string
          created: boolean
          message_id: string
        }[]
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
        Returns: undefined
      }
      user_has_restriction:
        | { Args: never; Returns: boolean }
        | {
            Args: { p_restriction_type: string; p_user_id: string }
            Returns: boolean
          }
      uuid_nil: { Args: never; Returns: string }
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
      app_role: "client" | "owner" | "admin"
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
      service_category_enum:
        | "nanny"
        | "baby_sitting"
        | "chef"
        | "home_cook"
        | "cleaning"
        | "massage"
        | "english_teacher"
        | "spanish_teacher"
        | "yoga"
        | "personal_trainer"
        | "handyman"
        | "gardener"
        | "pool_maintenance"
        | "driver"
        | "security"
        | "broker"
        | "tour_guide"
        | "photographer"
        | "pet_care"
        | "pet_sitting"
        | "music_teacher"
        | "beauty"
        | "other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["client", "owner", "admin"],
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
      service_category_enum: [
        "nanny",
        "baby_sitting",
        "chef",
        "home_cook",
        "cleaning",
        "massage",
        "english_teacher",
        "spanish_teacher",
        "yoga",
        "personal_trainer",
        "handyman",
        "gardener",
        "pool_maintenance",
        "driver",
        "security",
        "broker",
        "tour_guide",
        "photographer",
        "pet_care",
        "pet_sitting",
        "music_teacher",
        "beauty",
        "other",
      ],
      signature_type: ["drawn", "typed", "uploaded"],
      user_role: ["client", "owner", "admin"],
    },
  },
} as const
