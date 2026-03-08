-- 1. Create saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  search_name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches (user_id);

CREATE POLICY "Users can view own saved searches" ON public.saved_searches
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own saved searches" ON public.saved_searches
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own saved searches" ON public.saved_searches
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own saved searches" ON public.saved_searches
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 2. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  platform text DEFAULT 'web',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 3. Create user_security_settings table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  login_alerts boolean NOT NULL DEFAULT true,
  session_timeout boolean NOT NULL DEFAULT true,
  device_tracking boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security settings" ON public.user_security_settings
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own security settings" ON public.user_security_settings
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own security settings" ON public.user_security_settings
  FOR UPDATE USING ((select auth.uid()) = user_id);