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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_filter_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_categories: Json | null
          preferred_listing_types: Json | null
          preferred_locations: Json | null
          price_max: number | null
          price_min: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_categories?: Json | null
          preferred_listing_types?: Json | null
          preferred_locations?: Json | null
          price_max?: number | null
          price_min?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_categories?: Json | null
          preferred_listing_types?: Json | null
          preferred_locations?: Json | null
          price_max?: number | null
          price_min?: number | null
          updated_at?: string
          user_id?: string
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
          work_schedule?: string | null
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          match_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_contracts: {
        Row: {
          client_id: string
          client_signature: string | null
          client_signed_at: string | null
          content: string | null
          created_at: string
          id: string
          listing_id: string | null
          metadata: Json | null
          owner_id: string
          owner_signature: string | null
          owner_signed_at: string | null
          status: string
          template_type: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_signature?: string | null
          client_signed_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          owner_id: string
          owner_signature?: string | null
          owner_signed_at?: string | null
          status?: string
          template_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_signature?: string | null
          client_signed_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          owner_id?: string
          owner_signature?: string | null
          owner_signed_at?: string | null
          status?: string
          template_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_contracts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          direction: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          target_id: string
          target_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          address: string | null
          amenities: Json | null
          background_check_verified: boolean | null
          bathrooms: number | null
          baths: number | null
          battery_range: number | null
          bedrooms: number | null
          beds: number | null
          bicycle_type: string | null
          brake_type: string | null
          category: string
          certifications: Json | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          custom_service_name: string | null
          days_available: Json | null
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
          house_rules: string | null
          id: string
          image_url: string | null
          images: Json | null
          includes_basket: boolean | null
          includes_gear: boolean | null
          includes_helmet: boolean | null
          includes_lights: boolean | null
          includes_lock: boolean | null
          includes_pump: boolean | null
          insurance_verified: boolean | null
          is_active: boolean | null
          latitude: number | null
          listing_type: string | null
          location: string
          location_type: Json | null
          longitude: number | null
          mileage: number | null
          minimum_booking_hours: number | null
          mode: string | null
          motorcycle_type: string | null
          neighborhood: string | null
          number_of_gears: number | null
          offers_emergency_service: boolean | null
          owner_id: string | null
          pet_friendly: boolean | null
          price: number
          pricing_unit: string | null
          property_type: string | null
          rental_duration_type: string | null
          rental_rates: Json | null
          schedule_type: Json | null
          service_category: string | null
          service_radius_km: number | null
          services_included: Json | null
          skills: Json | null
          square_footage: number | null
          state: string | null
          status: string | null
          suspension_type: string | null
          time_slots_available: Json | null
          title: string
          tools_equipment: Json | null
          transmission: string | null
          updated_at: string
          user_id: string
          vehicle_brand: string | null
          vehicle_condition: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          wheel_size: string | null
          work_type: Json | null
          year: number | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          background_check_verified?: boolean | null
          bathrooms?: number | null
          baths?: number | null
          battery_range?: number | null
          bedrooms?: number | null
          beds?: number | null
          bicycle_type?: string | null
          brake_type?: string | null
          category?: string
          certifications?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          custom_service_name?: string | null
          days_available?: Json | null
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
          house_rules?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          includes_basket?: boolean | null
          includes_gear?: boolean | null
          includes_helmet?: boolean | null
          includes_lights?: boolean | null
          includes_lock?: boolean | null
          includes_pump?: boolean | null
          insurance_verified?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          listing_type?: string | null
          location: string
          location_type?: Json | null
          longitude?: number | null
          mileage?: number | null
          minimum_booking_hours?: number | null
          mode?: string | null
          motorcycle_type?: string | null
          neighborhood?: string | null
          number_of_gears?: number | null
          offers_emergency_service?: boolean | null
          owner_id?: string | null
          pet_friendly?: boolean | null
          price: number
          pricing_unit?: string | null
          property_type?: string | null
          rental_duration_type?: string | null
          rental_rates?: Json | null
          schedule_type?: Json | null
          service_category?: string | null
          service_radius_km?: number | null
          services_included?: Json | null
          skills?: Json | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          suspension_type?: string | null
          time_slots_available?: Json | null
          title: string
          tools_equipment?: Json | null
          transmission?: string | null
          updated_at?: string
          user_id: string
          vehicle_brand?: string | null
          vehicle_condition?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          wheel_size?: string | null
          work_type?: Json | null
          year?: number | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          background_check_verified?: boolean | null
          bathrooms?: number | null
          baths?: number | null
          battery_range?: number | null
          bedrooms?: number | null
          beds?: number | null
          bicycle_type?: string | null
          brake_type?: string | null
          category?: string
          certifications?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          custom_service_name?: string | null
          days_available?: Json | null
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
          house_rules?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          includes_basket?: boolean | null
          includes_gear?: boolean | null
          includes_helmet?: boolean | null
          includes_lights?: boolean | null
          includes_lock?: boolean | null
          includes_pump?: boolean | null
          insurance_verified?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          listing_type?: string | null
          location?: string
          location_type?: Json | null
          longitude?: number | null
          mileage?: number | null
          minimum_booking_hours?: number | null
          mode?: string | null
          motorcycle_type?: string | null
          neighborhood?: string | null
          number_of_gears?: number | null
          offers_emergency_service?: boolean | null
          owner_id?: string | null
          pet_friendly?: boolean | null
          price?: number
          pricing_unit?: string | null
          property_type?: string | null
          rental_duration_type?: string | null
          rental_rates?: Json | null
          schedule_type?: Json | null
          service_category?: string | null
          service_radius_km?: number | null
          services_included?: Json | null
          skills?: Json | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          suspension_type?: string | null
          time_slots_available?: Json | null
          title?: string
          tools_equipment?: Json | null
          transmission?: string | null
          updated_at?: string
          user_id?: string
          vehicle_brand?: string | null
          vehicle_condition?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          wheel_size?: string | null
          work_type?: Json | null
          year?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          owner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      message_activations: {
        Row: {
          activations_remaining: number
          created_at: string
          id: string
          total_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activations_remaining?: number
          created_at?: string
          id?: string
          total_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activations_remaining?: number
          created_at?: string
          id?: string
          total_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string | null
          metadata: Json | null
          notification_type: string
          related_user_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          related_user_id?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          related_user_id?: string | null
          title?: string | null
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
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          images: Json | null
          interests: Json | null
          languages_spoken: Json | null
          lifestyle_tags: Json | null
          nationality: string | null
          neighborhood: string | null
          phone: string | null
          smoking: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          work_schedule: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          images?: Json | null
          interests?: Json | null
          languages_spoken?: Json | null
          lifestyle_tags?: Json | null
          nationality?: string | null
          neighborhood?: string | null
          phone?: string | null
          smoking?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          work_schedule?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          images?: Json | null
          interests?: Json | null
          languages_spoken?: Json | null
          lifestyle_tags?: Json | null
          nationality?: string | null
          neighborhood?: string | null
          phone?: string | null
          smoking?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          work_schedule?: string | null
        }
        Relationships: []
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
      subscription_packages: {
        Row: {
          advanced_match_tips: boolean | null
          availability_sync: boolean | null
          best_deal_notifications: number | null
          created_at: string
          currency: string
          description: string | null
          duration_days: number | null
          early_profile_access: boolean | null
          features: Json | null
          id: number
          is_active: boolean
          legal_documents_included: number | null
          market_reports: boolean | null
          max_listings: number | null
          message_activations: number | null
          name: string
          package_category: string
          price: number
          seeker_insights: boolean | null
          tier: string
        }
        Insert: {
          advanced_match_tips?: boolean | null
          availability_sync?: boolean | null
          best_deal_notifications?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          early_profile_access?: boolean | null
          features?: Json | null
          id?: number
          is_active?: boolean
          legal_documents_included?: number | null
          market_reports?: boolean | null
          max_listings?: number | null
          message_activations?: number | null
          name: string
          package_category?: string
          price?: number
          seeker_insights?: boolean | null
          tier?: string
        }
        Update: {
          advanced_match_tips?: boolean | null
          availability_sync?: boolean | null
          best_deal_notifications?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          early_profile_access?: boolean | null
          features?: Json | null
          id?: number
          is_active?: boolean
          legal_documents_included?: number | null
          market_reports?: boolean | null
          max_listings?: number | null
          message_activations?: number | null
          name?: string
          package_category?: string
          price?: number
          seeker_insights?: boolean | null
          tier?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          is_active: boolean
          package_id: number | null
          payment_status: string | null
          starts_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: number
          is_active?: boolean
          package_id?: number | null
          payment_status?: string | null
          starts_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: number
          is_active?: boolean
          package_id?: number | null
          payment_status?: string | null
          starts_at?: string | null
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
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
      app_role: ["client", "owner"],
    },
  },
} as const
