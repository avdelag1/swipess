
-- 1. tokens table (monetization: message activations, quotas)
CREATE TABLE public.tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  token_type text DEFAULT 'message_activation',
  source text DEFAULT 'purchase',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tokens" ON public.tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tokens" ON public.tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tokens" ON public.tokens FOR UPDATE USING (auth.uid() = user_id);

-- 2. user_blocks table (safety: blocking users)
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can insert own blocks" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete own blocks" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- 3. user_reports table (safety: reporting users)
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_listing_id uuid,
  report_type text NOT NULL DEFAULT 'user',
  report_category text,
  report_reason text,
  report_details text,
  description text,
  evidence_urls jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.user_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can insert own reports" ON public.user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 4. contract_signatures table
CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.digital_contracts(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL,
  signature_data text NOT NULL,
  signature_type text NOT NULL DEFAULT 'drawn',
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view signatures on their contracts" ON public.contract_signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.digital_contracts WHERE id = contract_id AND (owner_id = auth.uid() OR client_id = auth.uid()))
);
CREATE POLICY "Users can insert signatures" ON public.contract_signatures FOR INSERT WITH CHECK (auth.uid() = signer_id);

-- 5. deal_status_tracking table
CREATE TABLE public.deal_status_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.digital_contracts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  listing_id uuid,
  status text NOT NULL DEFAULT 'pending',
  signed_by_owner_at timestamptz,
  signed_by_client_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_status_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deals" ON public.deal_status_tracking FOR SELECT USING (auth.uid() = client_id OR auth.uid() = owner_id);
CREATE POLICY "Users can insert own deals" ON public.deal_status_tracking FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own deals" ON public.deal_status_tracking FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- 6. user_radio_playlists table
CREATE TABLE public.user_radio_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  station_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_radio_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own playlists" ON public.user_radio_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own playlists" ON public.user_radio_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.user_radio_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.user_radio_playlists FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_tokens_user_id ON public.tokens(user_id);
CREATE INDEX idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON public.user_blocks(blocked_id);
CREATE INDEX idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX idx_contract_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX idx_deal_status_contract ON public.deal_status_tracking(contract_id);
CREATE INDEX idx_user_radio_playlists_user ON public.user_radio_playlists(user_id);
