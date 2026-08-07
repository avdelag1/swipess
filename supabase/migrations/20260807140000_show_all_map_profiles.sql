-- Show all map people pins that have coordinates again.
-- "Live" presence (location_source=device + recent stamp) is for the active badge,
-- not a hard filter — empty people map is worse than approximate pins.

DROP FUNCTION IF EXISTS public.get_passport_map_profiles(double precision, double precision, double precision, integer, uuid);

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
    AND (p_exclude_user_id IS NULL OR cp.user_id IS DISTINCT FROM p_exclude_user_id)
    AND public.haversine_km(p_user_lat, p_user_lon, cp.latitude, cp.longitude) <= p_radius_km
  ORDER BY
    -- Prefer recent device GPS, then everyone else with coords
    CASE
      WHEN cp.location_source = 'device'
        AND cp.location_updated_at IS NOT NULL
        AND cp.location_updated_at > (now() - interval '7 days')
      THEN 0
      ELSE 1
    END,
    distance_km
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_passport_map_profiles(double precision, double precision, double precision, integer, uuid)
  TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
