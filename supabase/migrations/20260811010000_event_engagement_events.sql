-- Event / promo business engagement funnel for admin analytics
CREATE TABLE IF NOT EXISTS public.event_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  promo_submission_id uuid REFERENCES public.business_promo_submissions(id) ON DELETE SET NULL,
  organizer_whatsapp text,
  organizer_name text,
  action text NOT NULL CHECK (action IN (
    'impression',
    'tap_contact',
    'tap_whatsapp',
    'tap_call',
    'request',
    'buy',
    'rent',
    'promote_submit',
    'tap_share',
    'tap_like',
    'tap_detail',
    'tap_promote_cta',
    'tap_events_entry'
  )),
  source text NOT NULL DEFAULT 'feed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS event_engagement_events_event_action_created_idx
  ON public.event_engagement_events (event_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS event_engagement_events_action_created_idx
  ON public.event_engagement_events (action, created_at DESC);

CREATE INDEX IF NOT EXISTS event_engagement_events_organizer_created_idx
  ON public.event_engagement_events (organizer_whatsapp, created_at DESC);

CREATE INDEX IF NOT EXISTS event_engagement_events_promo_created_idx
  ON public.event_engagement_events (promo_submission_id, created_at DESC);

ALTER TABLE public.event_engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own event engagement" ON public.event_engagement_events;
CREATE POLICY "Users insert own event engagement"
  ON public.event_engagement_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users insert anon session engagement" ON public.event_engagement_events;
CREATE POLICY "Users insert anon session engagement"
  ON public.event_engagement_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Admins read event engagement" ON public.event_engagement_events;
CREATE POLICY "Admins read event engagement"
  ON public.event_engagement_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('admin', 'super_admin', 'marketing')
    )
  );

-- Aggregated view for admin dashboards
CREATE OR REPLACE VIEW public.event_engagement_summary AS
SELECT
  COALESCE(event_id::text, 'none') AS event_key,
  event_id,
  organizer_name,
  organizer_whatsapp,
  action,
  source,
  count(*)::bigint AS total,
  count(DISTINCT user_id)::bigint AS unique_users,
  max(created_at) AS last_at
FROM public.event_engagement_events
GROUP BY event_id, organizer_name, organizer_whatsapp, action, source;

GRANT SELECT ON public.event_engagement_summary TO authenticated;
