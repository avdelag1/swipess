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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
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
      business_partners: {
        Row: {
          category: string
          created_at: string
          custom_discount_text: string | null
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          latitude: number | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          updated_at: string
          website_url: string | null
          whatsapp: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          custom_discount_text?: string | null
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          updated_at?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          custom_discount_text?: string | null
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          updated_at?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      client_filter_preferences: {
        Row: {
          amenities_required: Json | null
          bicycle_price_max: number | null
          bicycle_price_min: number | null
          bicycle_types: Json | null
          created_at: string
          furnished_required: boolean | null
          id: string
          interested_in_bicycles: boolean | null
          interested_in_motorcycles: boolean | null
          interested_in_properties: boolean | null
          interested_in_services: boolean | null
          interested_in_vehicles: boolean | null
          location_zones: Json | null
          max_bathrooms: number | null
          max_bedrooms: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          moto_price_max: number | null
          moto_price_min: number | null
          moto_types: Json | null
          moto_year_max: number | null
          moto_year_min: number | null
          pet_friendly_required: boolean | null
          preferred_categories: Json | null
          preferred_listing_types: Json | null
          preferred_locations: Json | null
          price_max: number | null
          price_min: number | null
          property_types: Json | null
          updated_at: string
          user_id: string
          vehicle_price_max: number | null
          vehicle_price_min: number | null
          vehicle_types: Json | null
        }
        Insert: {
          amenities_required?: Json | null
          bicycle_price_max?: number | null
          bicycle_price_min?: number | null
          bicycle_types?: Json | null
          created_at?: string
          furnished_required?: boolean | null
          id?: string
          interested_in_bicycles?: boolean | null
          interested_in_motorcycles?: boolean | null
          interested_in_properties?: boolean | null
          interested_in_services?: boolean | null
          interested_in_vehicles?: boolean | null
          location_zones?: Json | null
          max_bathrooms?: number | null
          max_bedrooms?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          moto_price_max?: number | null
          moto_price_min?: number | null
          moto_types?: Json | null
          moto_year_max?: number | null
          moto_year_min?: number | null
          pet_friendly_required?: boolean | null
          preferred_categories?: Json | null
          preferred_listing_types?: Json | null
          preferred_locations?: Json | null
          price_max?: number | null
          price_min?: number | null
          property_types?: Json | null
          updated_at?: string
          user_id: string
          vehicle_price_max?: number | null
          vehicle_price_min?: number | null
          vehicle_types?: Json | null
        }
        Update: {
          amenities_required?: Json | null
          bicycle_price_max?: number | null
          bicycle_price_min?: number | null
          bicycle_types?: Json | null
          created_at?: string
          furnished_required?: boolean | null
          id?: string
          interested_in_bicycles?: boolean | null
          interested_in_motorcycles?: boolean | null
          interested_in_properties?: boolean | null
          interested_in_services?: boolean | null
          interested_in_vehicles?: boolean | null
          location_zones?: Json | null
          max_bathrooms?: number | null
          max_bedrooms?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          moto_price_max?: number | null
          moto_price_min?: number | null
          moto_types?: Json | null
          moto_year_max?: number | null
          moto_year_min?: number | null
          pet_friendly_required?: boolean | null
          preferred_categories?: Json | null
          preferred_listing_types?: Json | null
          preferred_locations?: Json | null
          price_max?: number | null
          price_min?: number | null
          property_types?: Json | null
          updated_at?: string
          user_id?: string
          vehicle_price_max?: number | null
          vehicle_price_min?: number | null
          vehicle_types?: Json | null
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
          employer_name: string | null
          gender: string | null
          has_children: boolean | null
          id: number
          identity_verified: boolean | null
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
          occupation: string | null
          personality_traits: Json | null
          preferred_activities: Json | null
          profile_images: Json | null
          relationship_status: string | null
          roommate_available: boolean | null
          smoking_habit: string | null
          updated_at: string
          user_id: string
          verification_submitted_at: string | null
          work_schedule: string | null
          years_in_city: number | null
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
          employer_name?: string | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          identity_verified?: boolean | null
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
          occupation?: string | null
          personality_traits?: Json | null
          preferred_activities?: Json | null
          profile_images?: Json | null
          relationship_status?: string | null
          roommate_available?: boolean | null
          smoking_habit?: string | null
          updated_at?: string
          user_id: string
          verification_submitted_at?: string | null
          work_schedule?: string | null
          years_in_city?: number | null
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
          employer_name?: string | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          identity_verified?: boolean | null
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
          occupation?: string | null
          personality_traits?: Json | null
          preferred_activities?: Json | null
          profile_images?: Json | null
          relationship_status?: string | null
          roommate_available?: boolean | null
          smoking_habit?: string | null
          updated_at?: string
          user_id?: string
          verification_submitted_at?: string | null
          work_schedule?: string | null
          years_in_city?: number | null
        }
        Relationships: []
      }
      concierge_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          google_maps_url: string | null
          id: string
          is_active: boolean
          language: string
          phone: string | null
          tags: string[] | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          language?: string
          phone?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          language?: string
          phone?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          website_url?: string | null
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
          source_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          content_text: string
          content_type: string
          created_at?: string
          flag_reason: string
          id?: string
          source_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          content_text?: string
          content_type?: string
          created_at?: string
          flag_reason?: string
          id?: string
          source_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      content_shares: {
        Row: {
          click_count: number
          created_at: string
          id: string
          recipient_email: string | null
          recipient_phone: string | null
          share_method: string
          share_url: string | null
          shared_listing_id: string | null
          shared_profile_id: string | null
          sharer_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          share_method?: string
          share_url?: string | null
          shared_listing_id?: string | null
          shared_profile_id?: string | null
          sharer_id: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          share_method?: string
          share_url?: string | null
          shared_listing_id?: string | null
          shared_profile_id?: string | null
          sharer_id?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: string | null
          signature_data: string
          signature_type: string
          signed_at: string
          signer_id: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signature_type?: string
          signed_at?: string
          signer_id: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signature_type?: string
          signed_at?: string
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
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string | null
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
          is_read?: boolean | null
          message_text?: string | null
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
          is_read?: boolean | null
          message_text?: string | null
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
          client_id: string | null
          created_at: string
          free_messaging: boolean | null
          id: string
          last_message_at: string | null
          listing_id: string | null
          match_id: string | null
          owner_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          free_messaging?: boolean | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          match_id?: string | null
          owner_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          free_messaging?: boolean | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          match_id?: string | null
          owner_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_status_tracking: {
        Row: {
          client_id: string
          completed_at: string | null
          contract_id: string
          created_at: string
          id: string
          listing_id: string | null
          owner_id: string
          signed_by_client_at: string | null
          signed_by_owner_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          contract_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          owner_id: string
          signed_by_client_at?: string | null
          signed_by_owner_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          owner_id?: string
          signed_by_client_at?: string | null
          signed_by_owner_at?: string | null
          status?: string
          updated_at?: string
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
      discount_offers: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_redemptions: {
        Row: {
          amount_saved: number | null
          business_id: string
          business_note: string | null
          discount_percent: number
          id: string
          offer_id: string | null
          redeemed_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_saved?: number | null
          business_id: string
          business_note?: string | null
          discount_percent?: number
          id?: string
          offer_id?: string | null
          redeemed_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_saved?: number | null
          business_id?: string
          business_note?: string | null
          discount_percent?: number
          id?: string
          offer_id?: string | null
          redeemed_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "discount_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_reports: {
        Row: {
          contract_id: string
          created_at: string
          description: string | null
          id: string
          issue_type: string
          reported_against: string
          reported_by: string
          status: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          description?: string | null
          id?: string
          issue_type: string
          reported_against: string
          reported_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: string
          reported_against?: string
          reported_by?: string
          status?: string
          updated_at?: string
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
      escrow_deposits: {
        Row: {
          amount: number
          client_id: string
          contract_id: string | null
          created_at: string
          currency: string | null
          disputed_at: string | null
          held_at: string | null
          id: string
          listing_id: string | null
          notes: string | null
          owner_id: string
          released_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id: string
          contract_id?: string | null
          created_at?: string
          currency?: string | null
          disputed_at?: string | null
          held_at?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          owner_id: string
          released_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          contract_id?: string | null
          created_at?: string
          currency?: string | null
          disputed_at?: string | null
          held_at?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          owner_id?: string
          released_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_deposits_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "digital_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_favorites: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
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
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_tag: string | null
          event_date: string | null
          event_end_date: string | null
          id: string
          image_url: string | null
          image_urls: Json | null
          is_approved: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          latitude: number | null
          location: string | null
          location_detail: string | null
          longitude: number | null
          organizer_name: string | null
          organizer_photo_url: string | null
          organizer_whatsapp: string | null
          price_text: string | null
          promo_text: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_tag?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          is_approved?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          location?: string | null
          location_detail?: string | null
          longitude?: number | null
          organizer_name?: string | null
          organizer_photo_url?: string | null
          organizer_whatsapp?: string | null
          price_text?: string | null
          promo_text?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_tag?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          is_approved?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          location?: string | null
          location_detail?: string | null
          longitude?: number | null
          organizer_name?: string | null
          organizer_photo_url?: string | null
          organizer_whatsapp?: string | null
          price_text?: string | null
          promo_text?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legal_document_quota: {
        Row: {
          created_at: string
          id: string
          monthly_limit: number
          reset_date: string | null
          updated_at: string
          used_this_month: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_limit?: number
          reset_date?: string | null
          updated_at?: string
          used_this_month?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_limit?: number
          reset_date?: string | null
          updated_at?: string
          used_this_month?: number
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          status: string
          updated_at: string
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string
          status?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: []
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
          available_from: string | null
          available_to: string | null
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
          video_url: string | null
          views: number | null
          wheel_size: string | null
          work_type: Json | null
          year: number | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          available_from?: string | null
          available_to?: string | null
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
          video_url?: string | null
          views?: number | null
          wheel_size?: string | null
          work_type?: Json | null
          year?: number | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          available_from?: string | null
          available_to?: string | null
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
          video_url?: string | null
          views?: number | null
          wheel_size?: string | null
          work_type?: Json | null
          year?: number | null
        }
        Relationships: []
      }
      local_intel_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean | null
          neighborhood: string | null
          published_at: string | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          neighborhood?: string | null
          published_at?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          neighborhood?: string | null
          published_at?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "maintenance_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "digital_contracts"
            referencedColumns: ["id"]
          },
        ]
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
          verification_documents: Json | null
          verification_submitted_at: string | null
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
          verification_documents?: Json | null
          verification_submitted_at?: string | null
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
          verification_documents?: Json | null
          verification_submitted_at?: string | null
          verified_owner?: boolean | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          avg_price: number
          created_at: string
          currency: string | null
          id: string
          listing_count: number | null
          month: number
          neighborhood: string
          property_type: string | null
          year: number
        }
        Insert: {
          avg_price?: number
          created_at?: string
          currency?: string | null
          id?: string
          listing_count?: number | null
          month: number
          neighborhood: string
          property_type?: string | null
          year: number
        }
        Update: {
          avg_price?: number
          created_at?: string
          currency?: string | null
          id?: string
          listing_count?: number | null
          month?: number
          neighborhood?: string
          property_type?: string | null
          year?: number
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
          view_type: string
          viewed_profile_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          user_id: string
          view_type?: string
          viewed_profile_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
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
          is_active: boolean | null
          language: string | null
          languages_spoken: Json | null
          lifestyle_tags: Json | null
          nationality: string | null
          neighborhood: string | null
          onboarding_completed: boolean | null
          phone: string | null
          radio_current_station_id: string | null
          radio_is_powered_on: boolean | null
          role: string | null
          smoking: boolean | null
          swipe_sound_theme: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
          username: string | null
          work_schedule: string | null
        }
        Insert: {
          active_mode?: string | null
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
          is_active?: boolean | null
          language?: string | null
          languages_spoken?: Json | null
          lifestyle_tags?: Json | null
          nationality?: string | null
          neighborhood?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          radio_current_station_id?: string | null
          radio_is_powered_on?: boolean | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          work_schedule?: string | null
        }
        Update: {
          active_mode?: string | null
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
          is_active?: boolean | null
          language?: string | null
          languages_spoken?: Json | null
          lifestyle_tags?: Json | null
          nationality?: string | null
          neighborhood?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          radio_current_station_id?: string | null
          radio_is_powered_on?: boolean | null
          role?: string | null
          smoking?: boolean | null
          swipe_sound_theme?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          work_schedule?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          platform: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          platform?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          accuracy_rating: number | null
          cleanliness_rating: number | null
          comment: string | null
          communication_rating: number | null
          created_at: string
          helpful_count: number | null
          id: string
          is_flagged: boolean | null
          is_verified_stay: boolean | null
          listing_id: string | null
          location_rating: number | null
          rating: number
          responded_at: string | null
          response_text: string | null
          review_title: string | null
          review_type: string | null
          reviewed_id: string
          reviewer_id: string
          updated_at: string
          value_rating: number | null
        }
        Insert: {
          accuracy_rating?: number | null
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_flagged?: boolean | null
          is_verified_stay?: boolean | null
          listing_id?: string | null
          location_rating?: number | null
          rating?: number
          responded_at?: string | null
          response_text?: string | null
          review_title?: string | null
          review_type?: string | null
          reviewed_id: string
          reviewer_id: string
          updated_at?: string
          value_rating?: number | null
        }
        Update: {
          accuracy_rating?: number | null
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_flagged?: boolean | null
          is_verified_stay?: boolean | null
          listing_id?: string | null
          location_rating?: number | null
          rating?: number
          responded_at?: string | null
          response_text?: string | null
          review_title?: string | null
          review_type?: string | null
          reviewed_id?: string
          reviewer_id?: string
          updated_at?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_matches: {
        Row: {
          compatibility_score: number | null
          created_at: string
          direction: string
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string
          direction?: string
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string
          direction?: string
          id?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      roommate_preferences: {
        Row: {
          created_at: string
          deal_breakers: Json | null
          id: string
          is_seeking_roommate: boolean | null
          preferred_age_max: number | null
          preferred_age_min: number | null
          preferred_budget_max: number | null
          preferred_budget_min: number | null
          preferred_cleanliness: string | null
          preferred_drinking: string | null
          preferred_gender: Json | null
          preferred_move_in: string | null
          preferred_neighborhoods: Json | null
          preferred_noise_tolerance: string | null
          preferred_smoking: string | null
          preferred_work_schedule: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_breakers?: Json | null
          id?: string
          is_seeking_roommate?: boolean | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_budget_max?: number | null
          preferred_budget_min?: number | null
          preferred_cleanliness?: string | null
          preferred_drinking?: string | null
          preferred_gender?: Json | null
          preferred_move_in?: string | null
          preferred_neighborhoods?: Json | null
          preferred_noise_tolerance?: string | null
          preferred_smoking?: string | null
          preferred_work_schedule?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_breakers?: Json | null
          id?: string
          is_seeking_roommate?: boolean | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_budget_max?: number | null
          preferred_budget_min?: number | null
          preferred_cleanliness?: string | null
          preferred_drinking?: string | null
          preferred_gender?: Json | null
          preferred_move_in?: string | null
          preferred_neighborhoods?: Json | null
          preferred_noise_tolerance?: string | null
          preferred_smoking?: string | null
          preferred_work_schedule?: string | null
          updated_at?: string
          user_id?: string
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
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          last_matched_at: string | null
          search_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_matched_at?: string | null
          search_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_matched_at?: string | null
          search_name?: string
          user_id?: string
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
          paypal_link: string | null
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
          paypal_link?: string | null
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
          paypal_link?: string | null
          price?: number
          seeker_insights?: boolean | null
          tier?: string
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
          user_email?: string
          user_id: string
          user_role?: string
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
      tokens: {
        Row: {
          activation_type: string | null
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          remaining_activations: number | null
          reset_date: string | null
          source: string | null
          token_type: string | null
          total_activations: number | null
          updated_at: string
          used_activations: number | null
          user_id: string
        }
        Insert: {
          activation_type?: string | null
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          remaining_activations?: number | null
          reset_date?: string | null
          source?: string | null
          token_type?: string | null
          total_activations?: number | null
          updated_at?: string
          used_activations?: number | null
          user_id: string
        }
        Update: {
          activation_type?: string | null
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          remaining_activations?: number | null
          reset_date?: string | null
          source?: string | null
          token_type?: string | null
          total_activations?: number | null
          updated_at?: string
          used_activations?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
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
          created_at: string
          id: string
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_radio_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          station_ids: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          station_ids?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          station_ids?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          evidence_urls: Json | null
          id: string
          report_category: string | null
          report_details: string | null
          report_reason: string | null
          report_type: string
          reported_listing_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_urls?: Json | null
          id?: string
          report_category?: string | null
          report_details?: string | null
          report_reason?: string | null
          report_type?: string
          reported_listing_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_urls?: Json | null
          id?: string
          report_category?: string | null
          report_details?: string | null
          report_reason?: string | null
          report_type?: string
          reported_listing_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      user_security_settings: {
        Row: {
          created_at: string
          device_tracking: boolean
          id: string
          login_alerts: boolean
          session_timeout: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_tracking?: boolean
          id?: string
          login_alerts?: boolean
          session_timeout?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_tracking?: boolean
          id?: string
          login_alerts?: boolean
          session_timeout?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
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
      check_email_exists: { Args: { p_email: string }; Returns: Json }
      create_notification_for_user: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_notification_type: string
          p_related_user_id?: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          created_at: string
          full_name: string
          id: string
          images: Json
          interests: Json
          is_active: boolean
          languages_spoken: Json
          lifestyle_tags: Json
          neighborhood: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_already_reported: {
        Args: {
          p_reported_listing_id?: string
          p_reported_user_id?: string
          p_reporter_id: string
        }
        Returns: boolean
      }
      increment_review_helpful: {
        Args: { p_review_id: string }
        Returns: undefined
      }
      increment_share_clicks: {
        Args: { p_share_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      upsert_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "client" | "owner" | "admin"
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
      app_role: ["client", "owner", "admin"],
    },
  },
} as const

