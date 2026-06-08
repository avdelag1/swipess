-- ATOMIC SPEED INDEX: SEEKER REQUESTS DISCOVERY
-- Accelerates the SeekersPage query that loads active seeker (mode='seek') requests.
-- Query pattern:
--   SELECT ... FROM listings
--   WHERE listing_type = 'request'
--     AND mode = 'seek'
--     AND is_active = true
--   ORDER BY created_at DESC
--   LIMIT 50;
CREATE INDEX IF NOT EXISTS idx_listings_seekers_deck_v1
ON public.listings (listing_type, mode, is_active, created_at DESC)
WHERE listing_type = 'request' AND mode = 'seek' AND is_active = true;
