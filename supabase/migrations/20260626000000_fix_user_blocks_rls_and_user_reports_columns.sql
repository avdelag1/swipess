-- Fix two production schema-drift bugs surfaced in the client console:
--   1. INSERT into public.user_blocks failed with RLS error 42501 — the live DB
--      is missing the owner INSERT policy that the original migration defined,
--      so users can't block anyone.
--   2. INSERT into public.user_reports failed: "Could not find the 'description'
--      column" — the live table was created without the safety columns the
--      original migration defines, so reporting a user/listing throws.
--
-- This migration is fully idempotent (IF NOT EXISTS / DROP+CREATE), so it is
-- safe to run against the live database via the Supabase SQL editor.

-- 1) user_reports — ensure every column the Report dialog writes exists.
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS description         text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS report_category     text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS report_reason       text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS report_details      text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS report_type         text NOT NULL DEFAULT 'user';
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS reported_user_id    uuid;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS reported_listing_id uuid;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS evidence_urls       jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS status              text NOT NULL DEFAULT 'pending';

-- 2) user_blocks — re-assert the owner RLS policies (INSERT was being denied).
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can insert own blocks" ON public.user_blocks;
CREATE POLICY "Users can insert own blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);
