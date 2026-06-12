-- Add alerts_enabled column to saved_searches table
-- This column was referenced in the UI but was missing from the schema,
-- causing the alert toggle to silently do nothing.
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS alerts_enabled boolean NOT NULL DEFAULT false;
