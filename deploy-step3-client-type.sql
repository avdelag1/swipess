ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS client_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_profiles_client_type_check'
      AND conrelid = 'public.client_profiles'::regclass
  ) THEN
    ALTER TABLE public.client_profiles
      ADD CONSTRAINT client_profiles_client_type_check
      CHECK (client_type IS NULL OR client_type IN ('buyer', 'renter', 'hire'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_profiles_client_type
  ON public.client_profiles (client_type)
  WHERE client_type IS NOT NULL;

CREATE OR REPLACE FUNCTION public.derive_client_type_from_profile(
  p_intentions jsonb,
  p_occupation text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_intentions, '[]'::jsonb) ?| ARRAY['buy_property', 'buy_motorcycle']
      OR lower(COALESCE(p_occupation, '')) LIKE '%buy%'
      THEN 'buyer'
    WHEN COALESCE(p_intentions, '[]'::jsonb) ?| ARRAY['hire_service']
      OR lower(COALESCE(p_occupation, '')) LIKE '%hire%'
      OR lower(COALESCE(p_occupation, '')) LIKE '%service%'
      THEN 'hire'
    WHEN COALESCE(p_intentions, '[]'::jsonb) ?| ARRAY['rent_property', 'rent_motorcycle', 'rent_bicycle']
      OR lower(COALESCE(p_occupation, '')) LIKE '%rent%'
      THEN 'renter'
    ELSE NULL
  END;
$$;

UPDATE public.client_profiles cp
   SET client_type = public.derive_client_type_from_profile(cp.intentions, cp.occupation)
 WHERE cp.client_type IS NULL
   AND public.derive_client_type_from_profile(cp.intentions, cp.occupation) IS NOT NULL;

DROP FUNCTION IF EXISTS public.get_smart_clients(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_smart_clients(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  name text,
  age integer,
  gender text,
  city text,
  country text,
  images jsonb,
  avatar_url text,
  interests jsonb,
  lifestyle_tags jsonb,
  smoking boolean,
  work_schedule text,
  nationality text,
  languages_spoken jsonb,
  neighborhood text,
  bio text,
  onboarding_completed boolean,
  profile_images jsonb,
  preferred_activities jsonb,
  roommate_available boolean,
  client_type text,
  occupation text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    cp.name,
    COALESCE(p.age, cp.age) AS age,
    COALESCE(p.gender, cp.gender) AS gender,
    COALESCE(p.city, cp.city) AS city,
    COALESCE(p.country, cp.country) AS country,
    p.images,
    p.avatar_url,
    COALESCE(p.interests, cp.interests) AS interests,
    p.lifestyle_tags,
    p.smoking,
    COALESCE(p.work_schedule, cp.work_schedule) AS work_schedule,
    p.nationality,
    p.languages_spoken,
    COALESCE(p.neighborhood, cp.neighborhood) AS neighborhood,
    COALESCE(p.bio, cp.bio) AS bio,
    p.onboarding_completed,
    cp.profile_images,
    cp.preferred_activities,
    COALESCE(cp.roommate_available, false) AS roommate_available,
    COALESCE(
      cp.client_type,
      public.derive_client_type_from_profile(cp.intentions, cp.occupation)
    ) AS client_type,
    cp.occupation,
    ur.role::text,
    p.created_at
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'client'::public.app_role
  LEFT JOIN public.client_profiles cp ON cp.user_id = p.user_id
  WHERE (p_user_id IS NULL OR p.user_id IS DISTINCT FROM p_user_id)
    AND COALESCE(p.is_active, true) = true
  ORDER BY p.created_at ASC NULLS LAST, p.user_id ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_clients(uuid, integer, integer) TO authenticated;

NOTIFY pgrst, 'reload schema';