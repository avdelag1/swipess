
-- =====================================================
-- MIGRATION: 9-Feature Expansion for SwipesS
-- =====================================================

-- 1. neighborhood_data — zone info for heat map
CREATE TABLE public.neighborhood_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  avg_rent_price numeric DEFAULT 0,
  avg_sale_price numeric DEFAULT 0,
  listing_count integer DEFAULT 0,
  density_score integer DEFAULT 0,
  vibe_tags jsonb DEFAULT '[]'::jsonb,
  latitude double precision,
  longitude double precision,
  color_hex text DEFAULT '#6366f1',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.neighborhood_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view neighborhoods" ON public.neighborhood_data FOR SELECT USING (true);

-- 2. price_history — seasonal price tracker
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  avg_price numeric NOT NULL DEFAULT 0,
  listing_count integer DEFAULT 0,
  property_type text DEFAULT 'apartment',
  currency text DEFAULT 'MXN',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view price history" ON public.price_history FOR SELECT USING (true);

-- 3. local_intel_posts — community news feed
CREATE TABLE public.local_intel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  neighborhood text,
  image_url text,
  source_url text,
  is_published boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.local_intel_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published intel" ON public.local_intel_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can insert intel" ON public.local_intel_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own intel" ON public.local_intel_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own intel" ON public.local_intel_posts FOR DELETE USING (auth.uid() = author_id);

-- 4. escrow_deposits — deposit tracking
CREATE TABLE public.escrow_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.digital_contracts(id),
  client_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  listing_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'MXN',
  status text NOT NULL DEFAULT 'pending',
  held_at timestamptz,
  released_at timestamptz,
  disputed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.escrow_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view escrow" ON public.escrow_deposits FOR SELECT USING (auth.uid() = client_id OR auth.uid() = owner_id);
CREATE POLICY "Owners can create escrow" ON public.escrow_deposits FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Participants can update escrow" ON public.escrow_deposits FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- 5. roommate_preferences — opt-in for roommate matching
CREATE TABLE public.roommate_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_seeking_roommate boolean DEFAULT true,
  preferred_budget_min numeric,
  preferred_budget_max numeric,
  preferred_move_in date,
  preferred_neighborhoods jsonb DEFAULT '[]'::jsonb,
  preferred_gender jsonb DEFAULT '[]'::jsonb,
  deal_breakers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roommate_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all roommate prefs" ON public.roommate_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own prefs" ON public.roommate_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.roommate_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prefs" ON public.roommate_preferences FOR DELETE USING (auth.uid() = user_id);

-- 6. roommate_matches — mutual roommate likes
CREATE TABLE public.roommate_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  direction text NOT NULL DEFAULT 'right',
  compatibility_score numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);
ALTER TABLE public.roommate_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roommate matches" ON public.roommate_matches FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);
CREATE POLICY "Users can insert own roommate matches" ON public.roommate_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roommate matches" ON public.roommate_matches FOR UPDATE USING (auth.uid() = user_id);

-- 7. Modify listings — add availability dates
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS available_from date;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS available_to date;

-- 8. Modify owner_profiles — add verification fields
ALTER TABLE public.owner_profiles ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz;
ALTER TABLE public.owner_profiles ADD COLUMN IF NOT EXISTS verification_documents jsonb DEFAULT '[]'::jsonb;
