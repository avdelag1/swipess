-- ============================================================
-- FIX LISTING CATEGORY COLUMN (2026-03-17)
-- ============================================================
-- Problem: The listings.category column is typed as the listing_category ENUM
-- which only contains values like 'apartment', 'house', 'motorcycle', 'plumber', etc.
-- The frontend sends 'property' (for all property listings) and 'worker' (for all
-- worker/service listings) which are NOT valid ENUM values. This causes ALL property
-- and worker listing inserts to fail silently.
--
-- Fix: Change the column type from ENUM to TEXT so any category string is accepted.
-- This is backwards-compatible: existing ENUM values become plain text values.
-- ============================================================

-- Change category from listing_category ENUM to plain text
ALTER TABLE public.listings ALTER COLUMN category TYPE text;

-- Force PostgREST to reload schema cache so the type change is reflected immediately
NOTIFY pgrst, 'reload schema';
