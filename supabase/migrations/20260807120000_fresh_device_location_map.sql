-- Live presence on passport map: only device GPS, not city-centroid backfills.
-- Browsers cannot read IMEI; phone location on login / session is the source of truth.

ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_source text;

COMMENT ON COLUMN public.client_profiles.location_source IS
  'device = real phone GPS; city = approximate city centroid; legacy = pre-source data';
COMMENT ON COLUMN public.client_profiles.location_updated_at IS
  'When device GPS was last written. Map people pins require this within 7 days.';

-- Existing lat/lng were often city backfills — never treat as live presence until
-- the user opens the app with real GPS (persistClientProfileGps).
UPDATE public.client_profiles
SET location_source = 'legacy'
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND (location_source IS NULL OR location_source = '');

CREATE OR REPLACE FUNCTION public.get_passport_map_profiles(
  p_user_lat double precision,
  p_user_lon double precision,
  p_radius_km double precision DEFAULT 50,
  p_limit integer DEFAULT 300,
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  name text,
  city text,
  latitude double precision,
  longitude double precision,
  profile_images jsonb,
  bio text,
  age integer,
  occupation text,
  updated_at timestamptz,
  location_updated_at timestamptz,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    cp.user_id,
    cp.name,
    cp.city,
    cp.latitude,
    cp.longitude,
    cp.profile_images,
    cp.bio,
    cp.age,
    cp.occupation,
    cp.updated_at,
    cp.location_updated_at,
    public.haversine_km(p_user_lat, p_user_lon, cp.latitude, cp.longitude) AS distance_km
  FROM public.client_profiles cp
  WHERE cp.latitude IS NOT NULL
    AND cp.longitude IS NOT NULL
    -- Live presence only: real device GPS written recently
    AND cp.location_source = 'device'
    AND cp.location_updated_at IS NOT NULL
    AND cp.location_updated_at > (now() - interval '7 days')
    AND (p_exclude_user_id IS NULL OR cp.user_id IS DISTINCT FROM p_exclude_user_id)
    AND public.haversine_km(p_user_lat, p_user_lon, cp.latitude, cp.longitude) <= p_radius_km
  ORDER BY distance_km
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_passport_map_profiles(double precision, double precision, double precision, integer, uuid)
  TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
