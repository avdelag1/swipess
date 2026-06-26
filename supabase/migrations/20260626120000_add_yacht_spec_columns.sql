-- Yacht listing support: add the marine spec columns that YachtListingForm and
-- the AI listing extractor write, and that the preview screens read
-- (length_m, berths, max_passengers, hull_material, engines).
--
-- NOTE: the listings.category column is already TEXT (migration 20260317000001)
-- and the listing_category enum already contains 'yacht', so NO category change
-- is needed — yacht listings already insert fine; this only adds the extra
-- spec columns so a yacht's details persist instead of being dropped.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS) — safe to run in the Supabase SQL editor.
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS length_m       numeric;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS berths         integer;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS max_passengers integer;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS hull_material  text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS engines        text;
