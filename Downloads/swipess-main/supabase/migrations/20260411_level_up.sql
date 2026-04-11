-- ============================================================
-- SWIPESS LEVEL UP MIGRATION
-- ============================================================
-- Adding fields for:
-- 1. Identity Verification
-- 2. Proactive AI Nudges
-- 3. Advanced Geo-Discovery
-- ============================================================

-- 1. Identity Verification fields for all profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

-- 2. Proactive AI Nudges
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_ai_nudge_at timestamptz,
ADD COLUMN IF NOT EXISTS ai_nudge_count integer DEFAULT 0;

-- 3. Advanced Geo-Discovery (Universal Latitude/Longitude)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Index for geo-queries (Basic, assuming PostGIS might not be fully active yet)
CREATE INDEX IF NOT EXISTS idx_profiles_geo ON public.profiles (latitude, longitude);

-- 4. Audit Log for Verification (Admin oversight)
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents jsonb DEFAULT '[]'::jsonb,
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification requests" 
ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Trigger to update profile status when request is approved
CREATE OR REPLACE FUNCTION public.handle_verification_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles 
    SET verification_status = 'verified', identity_verified_at = now()
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.profiles 
    SET verification_status = 'rejected'
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_verification_request_update
AFTER UPDATE ON public.verification_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_verification_update();
