-- Add alerts_enabled column to saved_searches table
-- This column was referenced in the UI but was missing from the schema,
-- causing the alert toggle to silently do nothing.
-- Guard: create table first if an older environment never ran the create migration.

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  search_name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS alerts_enabled boolean NOT NULL DEFAULT false;
