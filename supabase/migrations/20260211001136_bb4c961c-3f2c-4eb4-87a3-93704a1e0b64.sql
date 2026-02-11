
-- ============================================================
-- 1. EXPAND LISTINGS TABLE with all columns the code expects
-- ============================================================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'rent',
  ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'rent',
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Mexico',
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS beds integer,
  ADD COLUMN IF NOT EXISTS baths integer,
  ADD COLUMN IF NOT EXISTS square_footage integer,
  ADD COLUMN IF NOT EXISTS furnished boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pet_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS house_rules text,
  ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS services_included jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rental_rates jsonb,
  ADD COLUMN IF NOT EXISTS rental_duration_type text,
  -- Vehicle fields
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS vehicle_brand text,
  ADD COLUMN IF NOT EXISTS vehicle_model text,
  ADD COLUMN IF NOT EXISTS vehicle_condition text,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS mileage integer,
  ADD COLUMN IF NOT EXISTS engine_cc integer,
  ADD COLUMN IF NOT EXISTS fuel_type text,
  ADD COLUMN IF NOT EXISTS transmission text,
  ADD COLUMN IF NOT EXISTS motorcycle_type text,
  ADD COLUMN IF NOT EXISTS has_abs boolean,
  ADD COLUMN IF NOT EXISTS has_esc boolean,
  ADD COLUMN IF NOT EXISTS has_traction_control boolean,
  ADD COLUMN IF NOT EXISTS has_heated_grips boolean,
  ADD COLUMN IF NOT EXISTS has_luggage_rack boolean,
  ADD COLUMN IF NOT EXISTS includes_helmet boolean,
  ADD COLUMN IF NOT EXISTS includes_gear boolean,
  -- Bicycle fields
  ADD COLUMN IF NOT EXISTS bicycle_type text,
  ADD COLUMN IF NOT EXISTS frame_size text,
  ADD COLUMN IF NOT EXISTS frame_material text,
  ADD COLUMN IF NOT EXISTS number_of_gears integer,
  ADD COLUMN IF NOT EXISTS suspension_type text,
  ADD COLUMN IF NOT EXISTS brake_type text,
  ADD COLUMN IF NOT EXISTS wheel_size text,
  ADD COLUMN IF NOT EXISTS electric_assist boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS battery_range integer,
  ADD COLUMN IF NOT EXISTS includes_lock boolean,
  ADD COLUMN IF NOT EXISTS includes_lights boolean,
  ADD COLUMN IF NOT EXISTS includes_basket boolean,
  ADD COLUMN IF NOT EXISTS includes_pump boolean,
  -- Worker/Service fields
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS custom_service_name text,
  ADD COLUMN IF NOT EXISTS pricing_unit text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS experience_years integer,
  ADD COLUMN IF NOT EXISTS service_radius_km integer,
  ADD COLUMN IF NOT EXISTS minimum_booking_hours integer,
  ADD COLUMN IF NOT EXISTS offers_emergency_service boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tools_equipment jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS days_available jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS time_slots_available jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS work_type jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule_type jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_type jsonb DEFAULT '[]'::jsonb;

-- Backfill owner_id from user_id for existing rows
UPDATE public.listings SET owner_id = user_id WHERE owner_id IS NULL;

-- ============================================================
-- 2. CLIENT_PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  name text,
  age integer,
  bio text,
  gender text,
  interests jsonb DEFAULT '[]'::jsonb,
  preferred_activities jsonb DEFAULT '[]'::jsonb,
  profile_images jsonb DEFAULT '[]'::jsonb,
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
  smoking_habit text,
  drinking_habit text,
  cleanliness_level text,
  noise_tolerance text,
  work_schedule text,
  dietary_preferences jsonb DEFAULT '[]'::jsonb,
  personality_traits jsonb DEFAULT '[]'::jsonb,
  interest_categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all client profiles"
  ON public.client_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own client profile"
  ON public.client_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client profile"
  ON public.client_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. OWNER_PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
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

ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all owner profiles"
  ON public.owner_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own owner profile"
  ON public.owner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own owner profile"
  ON public.owner_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. LIKES TABLE (replaces swipes for the new code)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'listing',
  direction text NOT NULL DEFAULT 'right',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own likes"
  ON public.likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. CLIENT_FILTER_PREFERENCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_filter_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  preferred_listing_types jsonb DEFAULT '["rent"]'::jsonb,
  preferred_categories jsonb DEFAULT '[]'::jsonb,
  price_min numeric,
  price_max numeric,
  preferred_locations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_filter_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own filter preferences"
  ON public.client_filter_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filter preferences"
  ON public.client_filter_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filter preferences"
  ON public.client_filter_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. EXPAND PROFILES TABLE with fields the code syncs to
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS languages_spoken jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS work_schedule text,
  ADD COLUMN IF NOT EXISTS lifestyle_tags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS smoking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

-- ============================================================
-- 7. Timestamp trigger for new tables
-- ============================================================
CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_profiles_updated_at
  BEFORE UPDATE ON public.owner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_filter_preferences_updated_at
  BEFORE UPDATE ON public.client_filter_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
