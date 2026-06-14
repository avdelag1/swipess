-- ════════════════════════════════════════════════════════════════════════
-- Legal help / service-package requests + admin visibility
--
-- The Legal hub (src/pages/LegalHub.tsx) inserts into `legal_help_requests`
-- when a user submits a legal-help case OR requests a service package — but the
-- table was never created in a migration, so those submissions had nowhere to
-- land and never reached an admin. This creates the table (idempotently), wires
-- RLS so the submitter can see their own and admins can see/triage everything,
-- and grants admins read access to digital_contracts so submitted smart
-- contracts also surface in the admin review screen.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.legal_help_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  category    text,
  subcategory text,
  description text NOT NULL,
  role        text,
  package_id  text,
  status      text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Backfill columns in case an older/manual version of the table already exists.
ALTER TABLE public.legal_help_requests ADD COLUMN IF NOT EXISTS package_id  text;
ALTER TABLE public.legal_help_requests ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.legal_help_requests ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'pending';

ALTER TABLE public.legal_help_requests ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can submit (the form also allows anonymous user_id = null).
DROP POLICY IF EXISTS "Users can submit legal requests" ON public.legal_help_requests;
CREATE POLICY "Users can submit legal requests"
  ON public.legal_help_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Submitters can read their own requests.
DROP POLICY IF EXISTS "Users can view their own legal requests" ON public.legal_help_requests;
CREATE POLICY "Users can view their own legal requests"
  ON public.legal_help_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read every request.
DROP POLICY IF EXISTS "Admins can view all legal requests" ON public.legal_help_requests;
CREATE POLICY "Admins can view all legal requests"
  ON public.legal_help_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admins can triage (update status / notes).
DROP POLICY IF EXISTS "Admins can update legal requests" ON public.legal_help_requests;
CREATE POLICY "Admins can update legal requests"
  ON public.legal_help_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

DROP TRIGGER IF EXISTS update_legal_help_requests_updated_at ON public.legal_help_requests;
CREATE TRIGGER update_legal_help_requests_updated_at
  BEFORE UPDATE ON public.legal_help_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_legal_help_requests_status
  ON public.legal_help_requests (status, created_at DESC);

-- Let admins see all submitted smart contracts in the review screen (the
-- existing policies only expose a contract to its own owner/client).
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.digital_contracts;
CREATE POLICY "Admins can view all contracts"
  ON public.digital_contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));
