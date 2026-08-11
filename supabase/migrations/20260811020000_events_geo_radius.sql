-- Geo coordinates for radius-based event discovery (same pattern as listings).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS visibility_radius_km double precision;

COMMENT ON COLUMN public.events.latitude IS 'Event venue latitude (WGS84) for nearby-only discovery';
COMMENT ON COLUMN public.events.longitude IS 'Event venue longitude (WGS84) for nearby-only discovery';
COMMENT ON COLUMN public.events.visibility_radius_km IS 'Optional per-event max distance (km). Null = use viewer discovery radius.';

CREATE INDEX IF NOT EXISTS events_geo_lat_lng_idx
  ON public.events (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
