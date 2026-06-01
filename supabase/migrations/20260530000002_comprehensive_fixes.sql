-- Comprehensive fixes: RLS policies + missing tables

-- 1. Fix likes RLS — add missing UPDATE policy
CREATE POLICY "Users can update their own likes"
  ON public.likes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix notifications INSERT — re-add self-insert policy (was dropped in security_hardening_phase2)
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Create business_promo_submissions table (was missing — used by AdvertisePage + AdminEventos)
CREATE TABLE IF NOT EXISTS public.business_promo_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text,
  title text,
  description text,
  event_date date,
  location text,
  location_detail text,
  contact_name text,
  contact_phone text,
  website text,
  image_url text,
  promo_text text,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_promo_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo submissions"
  ON public.business_promo_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo submissions"
  ON public.business_promo_submissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own promo submissions"
  ON public.business_promo_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update promo submissions"
  ON public.business_promo_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Add missing DELETE policies for user-owned tables

CREATE POLICY "Users can delete own client profile"
  ON public.client_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own owner profile"
  ON public.owner_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own digital contracts"
  ON public.digital_contracts FOR DELETE
  USING (auth.uid() = owner_id OR auth.uid() = client_id);

CREATE POLICY "Users can delete own escrow deposits"
  ON public.escrow_deposits FOR DELETE
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete own maintenance requests"
  ON public.maintenance_requests FOR DELETE
  USING (auth.uid() = tenant_id);

CREATE POLICY "Users can delete own legal documents"
  ON public.legal_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own security settings"
  ON public.user_security_settings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own owner preferences"
  ON public.owner_client_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roommate matches"
  ON public.roommate_matches FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can delete own client filter preferences"
  ON public.client_filter_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vap id card"
  ON public.vap_id_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dispute reports"
  ON public.dispute_reports FOR DELETE
  USING (auth.uid() = reported_by);

CREATE POLICY "Users can delete own support tickets"
  ON public.support_tickets FOR DELETE
  USING (auth.uid() = user_id);
