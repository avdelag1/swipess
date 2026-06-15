-- ============================================================
-- Passport map geo RPCs — server-side radius filtering
-- Replaces client-side 300-row table scans + haversine filter
-- ============================================================

CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT 6371.0 * 2 * atan2(
    sqrt(a),
    sqrt(greatest(0.0, 1.0 - a))
  )
  FROM (
    SELECT
      sin(radians(lat2 - lat1) / 2) ^ 2
      + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lon2 - lon1) / 2) ^ 2
      AS a
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.get_passport_map_listings(
  p_user_lat double precision,
  p_user_lon double precision,
  p_radius_km double precision DEFAULT 50,
  p_limit integer DEFAULT 300,
  p_exclude_owner_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  price numeric,
  images jsonb,
  category text,
  city text,
  latitude double precision,
  longitude double precision,
  bedrooms integer,
  bathrooms integer,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.title,
    l.price,
    l.images,
    l.category,
    l.city,
    l.latitude,
    l.longitude,
    l.bedrooms,
    l.bathrooms,
    public.haversine_km(p_user_lat, p_user_lon, l.latitude, l.longitude) AS distance_km
  FROM public.listings l
  WHERE l.latitude IS NOT NULL
    AND l.longitude IS NOT NULL
    AND COALESCE(l.is_active, true) = true
    AND COALESCE(l.status, 'active') = 'active'
    AND (p_exclude_owner_id IS NULL OR l.owner_id IS DISTINCT FROM p_exclude_owner_id)
    AND public.haversine_km(p_user_lat, p_user_lon, l.latitude, l.longitude) <= p_radius_km
  ORDER BY distance_km
  LIMIT p_limit;
$$;

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
    public.haversine_km(p_user_lat, p_user_lon, cp.latitude, cp.longitude) AS distance_km
  FROM public.client_profiles cp
  WHERE cp.latitude IS NOT NULL
    AND cp.longitude IS NOT NULL
    AND (p_exclude_user_id IS NULL OR cp.user_id IS DISTINCT FROM p_exclude_user_id)
    AND public.haversine_km(p_user_lat, p_user_lon, cp.latitude, cp.longitude) <= p_radius_km
  ORDER BY distance_km
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_passport_map_listings(double precision, double precision, double precision, integer, uuid)
  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_passport_map_profiles(double precision, double precision, double precision, integer, uuid)
  TO authenticated, anon;

NOTIFY pgrst, 'reload schema';