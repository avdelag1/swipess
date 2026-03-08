-- 1. Create content_shares table
CREATE TABLE IF NOT EXISTS public.content_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_id uuid NOT NULL,
  shared_listing_id uuid,
  shared_profile_id uuid,
  share_method text NOT NULL DEFAULT 'link_copied',
  recipient_email text,
  recipient_phone text,
  share_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_content_shares_sharer ON public.content_shares (sharer_id);

CREATE POLICY "Users can insert own shares" ON public.content_shares
  FOR INSERT WITH CHECK ((select auth.uid()) = sharer_id);

CREATE POLICY "Users can view own shares" ON public.content_shares
  FOR SELECT USING ((select auth.uid()) = sharer_id);

-- 2. Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  viewed_profile_id uuid NOT NULL,
  view_type text NOT NULL DEFAULT 'profile',
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, viewed_profile_id, view_type)
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profile_views_user ON public.profile_views (user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_lookup ON public.profile_views (user_id, view_type, action);

CREATE POLICY "Users can insert own views" ON public.profile_views
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view own views" ON public.profile_views
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own views" ON public.profile_views
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own views" ON public.profile_views
  FOR DELETE USING ((select auth.uid()) = user_id);