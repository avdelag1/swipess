-- ============================================================
-- SWIPESS COMPLETE DATABASE SCHEMA
-- ============================================================
-- Clean, organized schema for dual-app system:
-- 1. Main App (Clients + Owners)
-- 2. Admin Dashboard
--
-- Run this in Supabase SQL Editor or via CLI
-- ============================================================

-- ============================================================
-- SECTION 1: ENUMS & TYPES
-- ============================================================

CREATE TYPE app_role AS ENUM ('client', 'owner', 'admin');

CREATE TYPE listing_category AS ENUM (
  'apartment', 'house', 'room', 'studio',
  'car', 'motorcycle', 'bicycle', 'scooter',
  'plumber', 'electrician', 'cleaner', 'handyman', 'mover',
  'other'
);

-- ============================================================
-- SECTION 2: CORE USER TABLES
-- ============================================================

-- Main profiles table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  age integer CHECK (age >= 18 AND age <= 120),
  gender text,
  bio text,
  country text,
  city text,
  neighborhood text,
  nationality text,
  languages_spoken jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  interests jsonb DEFAULT '[]'::jsonb,
  lifestyle_tags jsonb DEFAULT '[]'::jsonb,
  work_schedule text,
  smoking boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User roles (client, owner, admin)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Client-specific profiles
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  age integer CHECK (age >= 18 AND age <= 120),
  bio text,
  gender text,
  profile_images jsonb DEFAULT '[]'::jsonb,
  interests jsonb DEFAULT '[]'::jsonb,
  preferred_activities jsonb DEFAULT '[]'::jsonb,
  country text,
  city text,
  neighborhood text,
  latitude double precision,
  longitude double precision,
  intentions jsonb DEFAULT '[]'::jsonb,
  nationality text,
  languages jsonb DEFAULT '[]'::jsonb,
  relationship_status text,
  has_children boolean DEFAULT false,
  smoking_habit text CHECK (smoking_habit IN ('never', 'occasionally', 'regularly')),
  drinking_habit text CHECK (drinking_habit IN ('never', 'socially', 'regularly')),
  cleanliness_level text CHECK (cleanliness_level IN ('low', 'medium', 'high')),
  noise_tolerance text CHECK (noise_tolerance IN ('low', 'medium', 'high')),
  work_schedule text CHECK (work_schedule IN ('regular', 'flexible', 'remote', 'shift')),
  dietary_preferences jsonb DEFAULT '[]'::jsonb,
  personality_traits jsonb DEFAULT '[]'::jsonb,
  interest_categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Owner-specific profiles
CREATE TABLE IF NOT EXISTS public.owner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  business_description text,
  business_location text,
  contact_email text,
  contact_phone text,
  profile_images jsonb DEFAULT '[]'::jsonb,
  verified_owner boolean DEFAULT false,
  service_offerings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 3: LISTINGS & CONTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category listing_category,
  listing_type text DEFAULT 'rent' CHECK (listing_type IN ('rent', 'sale', 'service')),
  mode text DEFAULT 'rent' CHECK (mode IN ('rent', 'sale', 'service')),
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'rented', 'sold', 'archived')),
  is_active boolean DEFAULT true,
  price numeric CHECK (price >= 0),
  currency text DEFAULT 'USD',
  images jsonb DEFAULT '[]'::jsonb,

  -- Location
  address text,
  city text,
  neighborhood text,
  country text DEFAULT 'Mexico',
  state text,
  latitude double precision,
  longitude double precision,

  -- Property fields
  property_type text CHECK (property_type IN ('apartment', 'house', 'room', 'studio', 'commercial')),
  beds integer CHECK (beds >= 0),
  baths integer CHECK (baths >= 0),
  square_footage integer CHECK (square_footage >= 0),
  furnished boolean DEFAULT false,
  pet_friendly boolean DEFAULT false,
  house_rules text,
  amenities jsonb DEFAULT '[]'::jsonb,
  services_included jsonb DEFAULT '[]'::jsonb,
  rental_rates jsonb,
  rental_duration_type text CHECK (rental_duration_type IN ('daily', 'weekly', 'monthly', 'yearly')),

  -- Vehicle fields
  vehicle_type text CHECK (vehicle_type IN ('car', 'motorcycle', 'bicycle', 'scooter', 'truck')),
  vehicle_brand text,
  vehicle_model text,
  vehicle_condition text CHECK (vehicle_condition IN ('excellent', 'good', 'fair', 'poor')),
  year integer CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  mileage integer CHECK (mileage >= 0),
  engine_cc integer CHECK (engine_cc >= 0),
  fuel_type text CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'none')),
  transmission text CHECK (transmission IN ('manual', 'automatic', 'semi-automatic')),
  motorcycle_type text,
  has_abs boolean DEFAULT false,
  has_esc boolean DEFAULT false,
  has_traction_control boolean DEFAULT false,
  has_heated_grips boolean DEFAULT false,
  has_luggage_rack boolean DEFAULT false,
  includes_helmet boolean DEFAULT false,
  includes_gear boolean DEFAULT false,

  -- Bicycle fields
  bicycle_type text CHECK (bicycle_type IN ('road', 'mountain', 'hybrid', 'electric', 'bmx', 'cruiser')),
  frame_size text,
  frame_material text,
  number_of_gears integer CHECK (number_of_gears >= 0),
  suspension_type text CHECK (suspension_type IN ('none', 'front', 'full', 'rear')),
  brake_type text CHECK (brake_type IN ('rim', 'disc', 'hydraulic', 'v-brake')),
  wheel_size text,
  electric_assist boolean DEFAULT false,
  battery_range integer CHECK (battery_range >= 0),
  includes_lock boolean DEFAULT false,
  includes_lights boolean DEFAULT false,
  includes_basket boolean DEFAULT false,
  includes_pump boolean DEFAULT false,

  -- Service/Worker fields
  service_category text,
  custom_service_name text,
  pricing_unit text CHECK (pricing_unit IN ('hourly', 'daily', 'weekly', 'monthly', 'project')),
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'expert', 'master')),
  experience_years integer CHECK (experience_years >= 0 AND experience_years <= 70),
  service_radius_km integer CHECK (service_radius_km >= 0),
  minimum_booking_hours integer CHECK (minimum_booking_hours >= 0),
  offers_emergency_service boolean DEFAULT false,
  background_check_verified boolean DEFAULT false,
  insurance_verified boolean DEFAULT false,
  skills jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  tools_equipment jsonb DEFAULT '[]'::jsonb,
  days_available jsonb DEFAULT '[]'::jsonb,
  time_slots_available jsonb DEFAULT '[]'::jsonb,
  work_type jsonb DEFAULT '[]'::jsonb,
  schedule_type jsonb DEFAULT '[]'::jsonb,
  location_type jsonb DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 4: MATCHING & INTERACTIONS
-- ============================================================

-- User swipes (likes/passes)
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'listing' CHECK (target_type IN ('listing', 'profile')),
  direction text NOT NULL DEFAULT 'right' CHECK (direction IN ('left', 'right')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

-- Mutual matches
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  matched_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (client_id != owner_id)
);

-- ============================================================
-- SECTION 5: MESSAGING SYSTEM
-- ============================================================

-- Conversations (one per match)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (client_id != owner_id)
);

-- Individual messages
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments jsonb DEFAULT '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 6: MONETIZATION
-- ============================================================

-- Subscription packages (plans available for purchase)
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'MXN',
  tier text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'unlimited', 'pay_per_use')),
  package_category text NOT NULL DEFAULT 'client_monthly' CHECK (
    package_category IN ('client_monthly', 'owner_monthly', 'client_pay_per_use', 'owner_pay_per_use')
  ),
  duration_days integer DEFAULT 30 CHECK (duration_days > 0),
  tokens integer DEFAULT 0 CHECK (tokens >= 0),
  legal_documents_included integer DEFAULT 0 CHECK (legal_documents_included >= 0),
  best_deal_notifications integer DEFAULT 0,
  max_listings integer DEFAULT 1 CHECK (max_listings >= 0),
  early_profile_access boolean DEFAULT false,
  advanced_match_tips boolean DEFAULT false,
  seeker_insights boolean DEFAULT false,
  availability_sync boolean DEFAULT false,
  market_reports boolean DEFAULT false,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User subscriptions (purchased plans)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id integer NOT NULL REFERENCES public.subscription_packages(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Token balances (message credits)
CREATE TABLE IF NOT EXISTS public.tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activation_type text DEFAULT 'purchase' CHECK (
    activation_type IN ('purchase', 'subscription', 'welcome', 'referral_bonus', 'admin_grant', 'promotion')
  ),
  total_activations integer NOT NULL DEFAULT 0 CHECK (total_activations >= 0),
  remaining_activations integer NOT NULL DEFAULT 0 CHECK (remaining_activations >= 0),
  used_activations integer NOT NULL DEFAULT 0 CHECK (used_activations >= 0),
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 7: CONTRACTS & LEGAL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.digital_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  template_type text NOT NULL DEFAULT 'rental' CHECK (template_type IN ('rental', 'service', 'sale', 'custom')),
  title text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'cancelled', 'expired')),
  owner_signature text,
  client_signature text,
  owner_signed_at timestamptz,
  client_signed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_id != client_id)
);

-- ============================================================
-- SECTION 8: REVIEWS & RATINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reviewer_id != reviewed_id)
);

-- ============================================================
-- SECTION 9: NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL DEFAULT 'system_announcement' CHECK (
    notification_type IN ('match', 'message', 'like', 'review', 'contract', 'payment', 'system_announcement', 'promotion')
  ),
  title text,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  link_url text,
  related_user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 10: USER PREFERENCES
-- ============================================================

-- Client search filter preferences
CREATE TABLE IF NOT EXISTS public.client_filter_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_listing_types jsonb DEFAULT '["rent"]'::jsonb,
  preferred_categories jsonb DEFAULT '[]'::jsonb,
  price_min numeric CHECK (price_min >= 0),
  price_max numeric CHECK (price_max >= 0),
  preferred_locations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (price_max IS NULL OR price_min IS NULL OR price_max >= price_min)
);

-- Saved filter sets
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filter_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_role text NOT NULL DEFAULT 'client' CHECK (user_role IN ('client', 'owner')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- UI/UX preferences
CREATE TABLE IF NOT EXISTS public.user_visual_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  radio_current_station_id text,
  swipe_sound_theme text DEFAULT 'default',
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 11: ADMIN & ANALYTICS
-- ============================================================

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (
    action_type IN ('user_banned', 'user_unbanned', 'listing_removed', 'listing_restored',
                    'contract_reviewed', 'report_resolved', 'subscription_modified', 'token_granted')
  ),
  target_type text NOT NULL CHECK (target_type IN ('user', 'listing', 'contract', 'review', 'subscription', 'report')),
  target_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Platform analytics (aggregated metrics)
CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  metric_hour integer CHECK (metric_hour >= 0 AND metric_hour <= 23),
  total_active_users integer DEFAULT 0,
  new_signups integer DEFAULT 0,
  total_listings_created integer DEFAULT 0,
  total_matches integer DEFAULT 0,
  total_messages_sent integer DEFAULT 0,
  total_contracts_signed integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(metric_date, metric_hour)
);

-- User reports (inappropriate content/behavior)
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (
    report_type IN ('spam', 'inappropriate_content', 'scam', 'harassment', 'fake_profile', 'other')
  ),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes text,
  resolved_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reported_user_id IS NOT NULL OR reported_listing_id IS NOT NULL)
);

-- ============================================================
-- SECTION 12: INDEXES (Performance Optimization)
-- ============================================================

-- User lookups
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city_country ON public.profiles(city, country);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Client & Owner profiles
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON public.client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_city ON public.client_profiles(city);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_user_id ON public.owner_profiles(user_id);

-- Listings
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON public.listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_active_city ON public.listings(is_active, city) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON public.listings(category, status);

-- Likes & Matches
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON public.likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_likes_user_target ON public.likes(user_id, target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_matches_client ON public.matches(client_id);
CREATE INDEX IF NOT EXISTS idx_matches_owner ON public.matches(owner_id);
CREATE INDEX IF NOT EXISTS idx_matches_listing ON public.matches(listing_id);
CREATE INDEX IF NOT EXISTS idx_matches_pair ON public.matches(client_id, owner_id);

-- Messaging
CREATE INDEX IF NOT EXISTS idx_conversations_match ON public.conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_pair ON public.conversations(client_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON public.conversation_messages(conversation_id, created_at DESC);

-- Monetization
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON public.tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON public.tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON public.user_subscriptions(expires_at);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Admin
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.platform_analytics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.user_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON public.user_reports(status) WHERE status = 'pending';

-- ============================================================
-- SECTION 13: HELPER FUNCTIONS
-- ============================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Check if user is conversation participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(user_id_input UUID, conversation_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id_input
    AND (client_id = user_id_input OR owner_id = user_id_input)
  );
END;
$$;

-- RPC: Upsert user role
CREATE OR REPLACE FUNCTION public.upsert_user_role(p_user_id UUID, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
END;
$$;

-- RPC: Check if email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_role text;
BEGIN
  -- Look up user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  -- Get profile info
  SELECT id, full_name, email, avatar_url, created_at
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;

  -- Get role
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_user_id LIMIT 1;

  RETURN jsonb_build_object(
    'exists', true,
    'id', v_user_id,
    'email', p_email,
    'full_name', COALESCE(v_profile.full_name, ''),
    'avatar_url', COALESCE(v_profile.avatar_url, ''),
    'role', COALESCE(v_role, ''),
    'created_at', COALESCE(v_profile.created_at::text, now()::text)
  );
END;
$$;

-- Auto-create profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- SECTION 14: TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_profiles_updated_at BEFORE UPDATE ON public.owner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON public.tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_digital_contracts_updated_at BEFORE UPDATE ON public.digital_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_filter_preferences_updated_at BEFORE UPDATE ON public.client_filter_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_filters_updated_at BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_visual_preferences_updated_at BEFORE UPDATE ON public.user_visual_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 15: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_filter_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_visual_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can view, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: Users can view their own role, admins can view all
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Client profiles: Everyone can view, users can insert/update their own
CREATE POLICY "Client profiles viewable by everyone" ON public.client_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own client profile" ON public.client_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own client profile" ON public.client_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Owner profiles: Everyone can view, users can insert/update their own
CREATE POLICY "Owner profiles viewable by everyone" ON public.owner_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own owner profile" ON public.owner_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own owner profile" ON public.owner_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Listings: Everyone can view active listings, owners can manage their own
CREATE POLICY "Active listings viewable by everyone" ON public.listings FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "Owners can insert their own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own listings" ON public.listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own listings" ON public.listings FOR DELETE USING (auth.uid() = owner_id);

-- Likes: Users can view and manage their own likes
CREATE POLICY "Users can view their own likes" ON public.likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Matches: Users can view matches they're part of
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Conversations: Users can view conversations they're part of
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Messages: Users can view and send messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON public.conversation_messages FOR SELECT
  USING (public.is_conversation_participant(auth.uid(), conversation_id));
CREATE POLICY "Users can send messages in their conversations" ON public.conversation_messages FOR INSERT
  WITH CHECK (public.is_conversation_participant(auth.uid(), conversation_id) AND sender_id = auth.uid());
CREATE POLICY "Users can update their own messages" ON public.conversation_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Subscription packages: Anyone can view active packages
CREATE POLICY "Anyone can view active packages" ON public.subscription_packages FOR SELECT USING (is_active = true);

-- User subscriptions: Users can view and manage their own
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Tokens: Users can view their own tokens
CREATE POLICY "Users can view their own tokens" ON public.tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens" ON public.tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tokens" ON public.tokens FOR UPDATE USING (auth.uid() = user_id);

-- Digital contracts: Participants can view their contracts
CREATE POLICY "Users can view their own contracts" ON public.digital_contracts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = client_id);
CREATE POLICY "Owners can create contracts" ON public.digital_contracts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Participants can update contracts" ON public.digital_contracts FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = client_id);

-- Reviews: Everyone can view, reviewers can manage their own
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Notifications: Users can view and manage their own
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Filter preferences: Users can view and manage their own
CREATE POLICY "Users can view their own filter preferences" ON public.client_filter_preferences FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own filter preferences" ON public.client_filter_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own filter preferences" ON public.client_filter_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Saved filters: Users can manage their own
CREATE POLICY "Users can view their own saved filters" ON public.saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved filters" ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved filters" ON public.saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved filters" ON public.saved_filters FOR DELETE USING (auth.uid() = user_id);

-- Visual preferences: Users can manage their own
CREATE POLICY "Users can view their own visual preferences" ON public.user_visual_preferences FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own visual preferences" ON public.user_visual_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own visual preferences" ON public.user_visual_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin audit log: Only admins can view
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Platform analytics: Only admins can view
CREATE POLICY "Admins can view analytics" ON public.platform_analytics FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
CREATE POLICY "System can insert analytics" ON public.platform_analytics FOR INSERT WITH CHECK (true);

-- User reports: Users can create, admins can view all
CREATE POLICY "Users can create reports" ON public.user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON public.user_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.user_reports FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
CREATE POLICY "Admins can update reports" ON public.user_reports FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- ============================================================
-- SECTION 16: REALTIME SUBSCRIPTIONS
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- ============================================================
-- SECTION 17: ADMIN VIEWS (For Admin Dashboard)
-- ============================================================

-- Admin user summary view
CREATE OR REPLACE VIEW public.vw_admin_user_summary AS
SELECT
  u.id,
  u.email,
  u.created_at AS signup_date,
  u.last_sign_in_at,
  p.full_name,
  p.city,
  p.country,
  p.is_active,
  p.last_seen_at,
  ur.role,
  (SELECT COUNT(*) FROM public.listings WHERE owner_id = u.id) AS total_listings,
  (SELECT COUNT(*) FROM public.matches WHERE client_id = u.id OR owner_id = u.id) AS total_matches,
  (SELECT COUNT(*) FROM public.reviews WHERE reviewed_id = u.id) AS reviews_received,
  (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE reviewed_id = u.id) AS avg_rating,
  (SELECT SUM(remaining_activations) FROM public.tokens WHERE user_id = u.id) AS tokens_remaining
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id;

-- Admin listing summary view
CREATE OR REPLACE VIEW public.vw_admin_listing_summary AS
SELECT
  l.id,
  l.title,
  l.category,
  l.status,
  l.price,
  l.currency,
  l.city,
  l.country,
  l.is_active,
  l.created_at,
  op.business_name AS owner_name,
  u.email AS owner_email,
  l.owner_id,
  (SELECT COUNT(*) FROM public.likes WHERE target_id = l.id AND target_type = 'listing' AND direction = 'right') AS total_likes,
  (SELECT COUNT(*) FROM public.reviews WHERE listing_id = l.id) AS total_reviews,
  (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE listing_id = l.id) AS avg_rating
FROM public.listings l
LEFT JOIN public.owner_profiles op ON l.owner_id = op.user_id
LEFT JOIN auth.users u ON l.owner_id = u.id;

-- Admin revenue summary view
CREATE OR REPLACE VIEW public.vw_admin_revenue_summary AS
SELECT
  DATE_TRUNC('day', us.created_at) AS purchase_date,
  sp.package_category,
  sp.tier,
  COUNT(*) AS total_purchases,
  SUM(sp.price) AS total_revenue,
  ROUND(AVG(sp.price)::numeric, 2) AS avg_purchase_value
FROM public.user_subscriptions us
JOIN public.subscription_packages sp ON us.package_id = sp.id
WHERE us.payment_status = 'paid'
GROUP BY DATE_TRUNC('day', us.created_at), sp.package_category, sp.tier
ORDER BY purchase_date DESC;

-- ============================================================
-- SECTION 18: SEED DATA (Default Packages)
-- ============================================================

INSERT INTO public.subscription_packages (name, description, price, tier, package_category, duration_days, tokens, max_listings, features) VALUES
-- Client monthly plans
('Basic Client', 'Basic monthly plan for clients', 99, 'basic', 'client_monthly', 30, 6, 0, '["basic_search","save_listings","unlimited_swipes"]'),
('Premium Client', 'Premium monthly plan for clients', 249, 'premium', 'client_monthly', 30, 12, 0, '["basic_search","save_listings","advanced_filters","super_likes","priority_matches"]'),
('Unlimited Client', 'Unlimited monthly plan for clients', 499, 'unlimited', 'client_monthly', 30, 30, 0, '["all_features","unlimited_messages","vip_support"]'),

-- Owner monthly plans
('Basic Owner', 'Basic monthly plan for owners', 149, 'basic', 'owner_monthly', 30, 6, 3, '["basic_listing","basic_analytics","up_to_3_listings"]'),
('Premium Owner', 'Premium monthly plan for owners', 349, 'premium', 'owner_monthly', 30, 12, 10, '["basic_listing","advanced_analytics","property_boost","up_to_10_listings"]'),
('Unlimited Owner', 'Unlimited monthly plan for owners', 699, 'unlimited', 'owner_monthly', 30, 30, 999, '["all_features","unlimited_listings","priority_placement","dedicated_support"]'),

-- Client pay-per-use packs
('5 Token Pack', '5 tokens for new conversations', 69, 'pay_per_use', 'client_pay_per_use', 365, 5, 0, '[]'),
('10 Token Pack', '10 tokens for new conversations', 129, 'pay_per_use', 'client_pay_per_use', 365, 10, 0, '[]'),
('15 Token Pack', '15 tokens for new conversations', 179, 'pay_per_use', 'client_pay_per_use', 365, 15, 0, '[]'),

-- Owner pay-per-use packs
('5 Token Pack', '5 tokens for new conversations', 49, 'pay_per_use', 'owner_pay_per_use', 365, 5, 0, '[]'),
('10 Token Pack', '10 tokens for new conversations', 89, 'pay_per_use', 'owner_pay_per_use', 365, 10, 0, '[]'),
('15 Token Pack', '15 tokens for new conversations', 129, 'pay_per_use', 'owner_pay_per_use', 365, 15, 0, '[]')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Your database schema is now ready!
--
-- Next steps:
-- 1. Verify all tables were created
-- 2. Test RLS policies with different user roles
-- 3. Create seed data for testing
-- 4. Build your admin dashboard using the views
-- ============================================================
