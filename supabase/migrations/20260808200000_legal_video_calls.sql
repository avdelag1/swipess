ALTER TABLE public.lawyer_users
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.legal_video_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text,
  client_email text,
  lawyer_id uuid REFERENCES public.lawyer_users(id) ON DELETE SET NULL,
  lawyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ringing'
    CHECK (status IN ('ringing', 'accepted', 'declined', 'ended', 'missed', 'cancelled')),
  room_id text NOT NULL,
  topic text NOT NULL DEFAULT 'Legal consultation',
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS legal_video_calls_status_created_idx
  ON public.legal_video_calls (status, created_at DESC);

CREATE INDEX IF NOT EXISTS legal_video_calls_client_idx
  ON public.legal_video_calls (client_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS legal_video_calls_lawyer_idx
  ON public.legal_video_calls (lawyer_id, created_at DESC);

ALTER TABLE public.legal_video_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvc_client_insert" ON public.legal_video_calls;
CREATE POLICY "lvc_client_insert" ON public.legal_video_calls
  FOR INSERT TO authenticated
  WITH CHECK (client_user_id = auth.uid());

DROP POLICY IF EXISTS "lvc_client_select" ON public.legal_video_calls;
CREATE POLICY "lvc_client_select" ON public.legal_video_calls
  FOR SELECT TO authenticated
  USING (
    client_user_id = auth.uid()
    OR lawyer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lawyer_users lu
      WHERE lu.user_id = auth.uid() AND lu.is_active = true
    )
  );

DROP POLICY IF EXISTS "lvc_client_update" ON public.legal_video_calls;
CREATE POLICY "lvc_client_update" ON public.legal_video_calls
  FOR UPDATE TO authenticated
  USING (
    client_user_id = auth.uid()
    OR lawyer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lawyer_users lu
      WHERE lu.user_id = auth.uid() AND lu.is_active = true
    )
  )
  WITH CHECK (
    client_user_id = auth.uid()
    OR lawyer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lawyer_users lu
      WHERE lu.user_id = auth.uid() AND lu.is_active = true
    )
  );

CREATE OR REPLACE FUNCTION public.count_available_lawyers()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.lawyer_users
  WHERE is_active = true AND is_available = true;
$$;

REVOKE ALL ON FUNCTION public.count_available_lawyers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_available_lawyers() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.accept_legal_video_call(p_call_id uuid)
RETURNS public.legal_video_calls
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lawyer public.lawyer_users%ROWTYPE;
  v_call public.legal_video_calls%ROWTYPE;
BEGIN
  SELECT * INTO v_lawyer
  FROM public.lawyer_users
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  IF v_lawyer.id IS NULL THEN
    RAISE EXCEPTION 'Not an active lawyer';
  END IF;

  UPDATE public.legal_video_calls
  SET
    status = 'accepted',
    lawyer_id = v_lawyer.id,
    lawyer_user_id = auth.uid(),
    answered_at = now()
  WHERE id = p_call_id
    AND status = 'ringing'
  RETURNING * INTO v_call;

  IF v_call.id IS NULL THEN
    RAISE EXCEPTION 'Call is no longer available';
  END IF;

  RETURN v_call;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_legal_video_call(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_legal_video_call(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_legal_video_call(p_call_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.lawyer_users
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not an active lawyer';
  END IF;

  UPDATE public.legal_video_calls
  SET status = 'ended', ended_at = now()
  WHERE id = p_call_id
    AND lawyer_user_id = auth.uid()
    AND status = 'accepted';
END;
$$;

REVOKE ALL ON FUNCTION public.decline_legal_video_call(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decline_legal_video_call(uuid) TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_video_calls;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
