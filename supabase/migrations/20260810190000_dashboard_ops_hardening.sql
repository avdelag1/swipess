-- Ops hardening: lawyer request RLS, commission payment notifications,
-- published site_content for bank instructions, owner scan profile access

-- 1) Fix lawyer RLS helpers (is_lawyer_user has no args in live schema)
DROP POLICY IF EXISTS "Lawyers can view all disputes" ON public.dispute_reports;
CREATE POLICY "Lawyers can view all disputes"
  ON public.dispute_reports FOR SELECT TO authenticated
  USING (public.is_lawyer_user());

DROP POLICY IF EXISTS "Lawyers can update dispute status" ON public.dispute_reports;
CREATE POLICY "Lawyers can update dispute status"
  ON public.dispute_reports FOR UPDATE TO authenticated
  USING (public.is_lawyer_user())
  WITH CHECK (public.is_lawyer_user());

DROP POLICY IF EXISTS "Lawyers can view all user reports" ON public.user_reports;
CREATE POLICY "Lawyers can view all user reports"
  ON public.user_reports FOR SELECT TO authenticated
  USING (public.is_lawyer_user());

DROP POLICY IF EXISTS "Lawyers can update user report status" ON public.user_reports;
CREATE POLICY "Lawyers can update user report status"
  ON public.user_reports FOR UPDATE TO authenticated
  USING (public.is_lawyer_user())
  WITH CHECK (public.is_lawyer_user());

DROP POLICY IF EXISTS "Lawyers can view all property reports" ON public.property_reports;
CREATE POLICY "Lawyers can view all property reports"
  ON public.property_reports FOR SELECT TO authenticated
  USING (public.is_lawyer_user());

DROP POLICY IF EXISTS "Lawyers can update property report status" ON public.property_reports;
CREATE POLICY "Lawyers can update property report status"
  ON public.property_reports FOR UPDATE TO authenticated
  USING (public.is_lawyer_user())
  WITH CHECK (public.is_lawyer_user());

-- 2) Commission payment submissions (owner + lawyer)
CREATE TABLE IF NOT EXISTS public.commission_payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal TEXT NOT NULL CHECK (portal IN ('owner', 'lawyer')),
  business_id UUID REFERENCES public.partner_businesses(id) ON DELETE SET NULL,
  lawyer_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'confirmed', 'rejected')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_payment_submissions_created
  ON public.commission_payment_submissions (created_at DESC);

ALTER TABLE public.commission_payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bo_insert_commission_payments" ON public.commission_payment_submissions;
CREATE POLICY "bo_insert_commission_payments" ON public.commission_payment_submissions
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_admin_user(auth.uid())
    OR (
      portal = 'owner' AND EXISTS (
        SELECT 1 FROM public.business_owners bo
        WHERE bo.user_id = auth.uid() AND bo.is_active = true
          AND (business_id IS NULL OR bo.business_id = business_id)
      )
    )
    OR (
      portal = 'lawyer' AND EXISTS (
        SELECT 1 FROM public.lawyer_users lu
        WHERE lu.user_id = auth.uid() AND lu.is_active = true
      )
    )
  )
);

DROP POLICY IF EXISTS "bo_select_own_commission_payments" ON public.commission_payment_submissions;
CREATE POLICY "bo_select_own_commission_payments" ON public.commission_payment_submissions
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin_user(auth.uid())
);

CREATE OR REPLACE FUNCTION public.notify_commission_payment(
  p_portal TEXT,
  p_amount NUMERIC,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_lawyer_id UUID;
  v_submission_id UUID;
  v_label TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_portal NOT IN ('owner', 'lawyer') THEN
    RAISE EXCEPTION 'Invalid portal';
  END IF;

  IF p_portal = 'owner' THEN
    SELECT bo.business_id INTO v_business_id
    FROM public.business_owners bo
    WHERE bo.user_id = auth.uid() AND bo.is_active = true
    LIMIT 1;
    IF v_business_id IS NULL THEN
      RAISE EXCEPTION 'Not a business owner';
    END IF;
    v_label := 'Business owner commission payment';
  ELSE
    SELECT lu.id INTO v_lawyer_id
    FROM public.lawyer_users lu
    WHERE lu.user_id = auth.uid() AND lu.is_active = true
    LIMIT 1;
    IF v_lawyer_id IS NULL THEN
      RAISE EXCEPTION 'Not a lawyer';
    END IF;
    v_label := 'Lawyer commission payment';
  END IF;

  INSERT INTO public.commission_payment_submissions (
    portal, business_id, lawyer_id, amount, note, status, created_by
  ) VALUES (
    p_portal, v_business_id, v_lawyer_id, COALESCE(p_amount, 0), NULLIF(trim(p_note), ''), 'submitted', auth.uid()
  )
  RETURNING id INTO v_submission_id;

  -- Notify active admins (best-effort)
  INSERT INTO public.notifications (user_id, title, message, notification_type, link_url, metadata, is_read)
  SELECT au.user_id,
         v_label,
         'Payment of $' || COALESCE(p_amount, 0)::text || ' marked as sent. Review in admin.',
         'system_announcement',
         '/dashboard',
         jsonb_build_object(
           'kind', 'commission_payment',
           'submission_id', v_submission_id,
           'portal', p_portal,
           'amount', p_amount
         ),
         false
  FROM public.admin_users au
  WHERE au.is_active = true;

  RETURN jsonb_build_object('ok', true, 'submission_id', v_submission_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_commission_payment(TEXT, NUMERIC, TEXT) TO authenticated;

-- 3) Allow authenticated users to read published commission bank details
DROP POLICY IF EXISTS "authenticated_read_published_commission_content" ON public.site_content;
CREATE POLICY "authenticated_read_published_commission_content" ON public.site_content
FOR SELECT TO authenticated
USING (
  page_key = 'commission_payment'
  AND COALESCE(is_published, true) = true
);

-- 4) Business owners can read client profiles of users they have scanned
DROP POLICY IF EXISTS "bo_select_scanned_client_profiles" ON public.client_profiles;
CREATE POLICY "bo_select_scanned_client_profiles" ON public.client_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.business_owners bo
    JOIN public.qr_scans qs ON qs.business_id = bo.business_id
    WHERE bo.user_id = auth.uid()
      AND bo.is_active = true
      AND qs.scanned_user_id = client_profiles.user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.business_owners bo
    WHERE bo.user_id = auth.uid()
      AND bo.is_active = true
  )
);
