-- Create a dedicated VAP ID Card table so virtual card data persists independently
-- of client_profiles schema changes/migrations. Each user gets exactly one row.

CREATE TABLE IF NOT EXISTS public.vap_id_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  country TEXT,
  bio TEXT,
  occupation TEXT,
  city TEXT,
  nationality TEXT,
  years_in_city INTEGER,
  languages TEXT[],
  interests TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique constraint: one card per user
ALTER TABLE public.vap_id_cards ADD CONSTRAINT vap_id_cards_user_id_key UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.vap_id_cards ENABLE ROW LEVEL SECURITY;

-- Users can read their own card
CREATE POLICY "Users can read own vap card"
  ON public.vap_id_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own card
CREATE POLICY "Users can insert own vap card"
  ON public.vap_id_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own card
CREATE POLICY "Users can update own vap card"
  ON public.vap_id_cards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_vap_id_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vap_id_cards_updated_at ON public.vap_id_cards;
CREATE TRIGGER vap_id_cards_updated_at
  BEFORE UPDATE ON public.vap_id_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vap_id_cards_updated_at();
