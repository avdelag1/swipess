-- Legal Service Packages + Package Requests
-- Connects the Swipess app to the shared Lawyer Portal (admin-swipess) on the
-- same Supabase project. App users browse legal service packages (managed by
-- lawyers in the portal) and submit requests; lawyers receive those requests in
-- their portal and continue the conversation / quoting there.
--
-- NOTE: `legal_service_packages` is owned by the Lawyer Portal. We create it
-- IF NOT EXISTS so the app DB is self-contained on fresh environments, and we
-- only seed the default catalogue when the table is completely empty (so we
-- never clobber lawyer-managed data).

-- Ensure the shared updated_at trigger function exists (idempotent).
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Service packages catalogue (shared with Lawyer Portal)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_service_packages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text NOT NULL,
  description   text,
  price         numeric(10,2) NOT NULL DEFAULT 0,
  duration_days integer,
  features      jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_service_packages ENABLE ROW LEVEL SECURITY;

-- Any authenticated app user can browse the active catalogue.
DROP POLICY IF EXISTS "Anyone can view active legal packages" ON public.legal_service_packages;
CREATE POLICY "Anyone can view active legal packages" ON public.legal_service_packages
  FOR SELECT USING (is_active = true);

-- Seed the default catalogue ONLY when the table is empty (never overwrite
-- packages the Lawyer Portal already manages).
INSERT INTO public.legal_service_packages (name, category, description, price, duration_days, features, is_active)
SELECT name, category, description, price, duration_days, features::jsonb, true
FROM (VALUES
  ('House Sale — Basic',        'house_sale', 'Essential legal support to sell your property safely.',                  1500, 30,  '["Title search & review","Purchase agreement preparation","Closing document review","1 attorney consultation (1 hr)"]'),
  ('House Sale — Standard',     'house_sale', 'Full-service support with negotiation and post-closing help.',            2500, 45,  '["Everything in Basic","Title insurance assistance","Negotiation support","Up to 3 consultations","Post-closing support (30 days)"]'),
  ('House Sale — Premium',      'house_sale', 'End-to-end protection including tax and dispute coverage.',                4000, 60,  '["Everything in Standard","Unlimited consultations (90 days)","Tax implications review","HOA document review","Dispute resolution coverage"]'),
  ('Rental Agreement — Basic',  'rental',     'A solid, enforceable lease drafted for your property.',                    500,  7,   '["Lease agreement drafting","Basic tenant screening review","1 revision included"]'),
  ('Rental Agreement — Standard','rental',    'Lease plus addendums, checklists and a consultation.',                     900,  14,  '["Everything in Basic","Move-in/out checklist","Addendum preparation","Up to 3 revisions","30-min consultation"]'),
  ('Rental Agreement — Full',   'rental',     'Multi-unit ready package with unlimited revisions.',                       1600, 21,  '["Everything in Standard","Multi-unit lease package","Section 8 compliance review","Unlimited revisions (30 days)","2 hr consultation"]'),
  ('Eviction — Basic',          'eviction',   'Notice, filing and a court hearing to recover your property.',             800,  45,  '["Pay or Quit notice","Unlawful detainer filing","Court representation (1 hearing)"]'),
  ('Eviction — Full',           'eviction',   'Full court representation through to recovery of judgment.',               1800, 90,  '["Everything in Basic","Full court representation","Writ of possession","Judgment recovery assistance","Up to 3 hearings"]'),
  ('Divorce — Uncontested',     'divorce',    'Streamlined, amicable divorce with all documents prepared.',              1200, 60,  '["Divorce petition drafting","Marital settlement agreement","Property division documents","Court filing assistance"]'),
  ('Divorce — With Children',   'divorce',    'Custody, support and parenting plans handled end-to-end.',                 3500, 120, '["Divorce petition","Custody & visitation plan","Child support calculation","Parenting agreement","3 court hearings"]'),
  ('Divorce — Contested',       'divorce',    'Full representation for complex, disputed divorces.',                      5000, 180, '["Full legal representation","Discovery assistance","Mediation support","Child custody filing","Asset valuation","5 court appearances"]'),
  ('NDA Drafting',              'nda',        'A custom non-disclosure agreement, mutual or one-way.',                    350,  3,   '["Custom NDA drafting","Mutual or one-way options","1 revision included"]'),
  ('Business Formation',        'business',   'Form your company the right way with full guidance.',                      1000, 14,  '["Entity selection consultation","Articles of incorporation","Operating agreement","EIN registration guidance","1-year registered agent"]'),
  ('Property Dispute',          'dispute',    'Resolve property conflicts through demand, mediation or court.',           2000, 90,  '["Case evaluation","Demand letter","Mediation representation","Litigation (up to 2 hearings)"]'),
  ('Estate Planning — Basic',   'estate',     'Core estate documents to protect your family.',                            800,  14,  '["Simple will drafting","Healthcare directive","Power of attorney","Notarization assistance"]'),
  ('Estate Planning — Full',    'estate',     'Complete estate plan with living trust and annual review.',                2200, 30,  '["Everything in Basic","Living trust setup","Trust funding guidance","Beneficiary designation review","1-year plan review"]')
) AS seed(name, category, description, price, duration_days, features)
WHERE NOT EXISTS (SELECT 1 FROM public.legal_service_packages);

CREATE INDEX IF NOT EXISTS idx_legal_service_packages_active   ON public.legal_service_packages (is_active);
CREATE INDEX IF NOT EXISTS idx_legal_service_packages_category ON public.legal_service_packages (category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Package requests (app users -> Lawyer Portal inbox)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_package_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id       uuid REFERENCES public.legal_service_packages(id) ON DELETE SET NULL,
  package_name     text,
  package_category text,
  quoted_price     numeric(10,2),
  situation        text,                       -- user's description of their case
  full_name        text,
  email            text,
  phone            text,
  preferred_contact text NOT NULL DEFAULT 'phone',  -- phone | email | whatsapp
  request_type     text NOT NULL DEFAULT 'request', -- request | custom_quote
  status           text NOT NULL DEFAULT 'pending', -- pending | reviewing | quoted | accepted | declined | closed
  source           text NOT NULL DEFAULT 'swipess_app',
  lawyer_notes     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_package_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legal_package_requests_user    ON public.legal_package_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_legal_package_requests_status  ON public.legal_package_requests (status);
CREATE INDEX IF NOT EXISTS idx_legal_package_requests_package ON public.legal_package_requests (package_id);
CREATE INDEX IF NOT EXISTS idx_legal_package_requests_created ON public.legal_package_requests (created_at DESC);

-- App user can submit and read/track their own requests.
DROP POLICY IF EXISTS "Users can insert own package requests" ON public.legal_package_requests;
CREATE POLICY "Users can insert own package requests" ON public.legal_package_requests
  FOR INSERT WITH CHECK ((select auth.uid()) = requested_by);

DROP POLICY IF EXISTS "Users can view own package requests" ON public.legal_package_requests;
CREATE POLICY "Users can view own package requests" ON public.legal_package_requests
  FOR SELECT USING ((select auth.uid()) = requested_by);

-- Lawyers (Lawyer Portal accounts) can read every request and update its
-- status. Guarded so the migration still applies on environments where the
-- Lawyer Portal tables have not been created yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lawyer_users'
  ) THEN
    DROP POLICY IF EXISTS "Lawyers can view all package requests" ON public.legal_package_requests;
    CREATE POLICY "Lawyers can view all package requests" ON public.legal_package_requests
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.lawyer_users lu
          WHERE lu.user_id = (select auth.uid()) AND lu.is_active = true
        )
      );

    DROP POLICY IF EXISTS "Lawyers can update package requests" ON public.legal_package_requests;
    CREATE POLICY "Lawyers can update package requests" ON public.legal_package_requests
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.lawyer_users lu
          WHERE lu.user_id = (select auth.uid()) AND lu.is_active = true
        )
      );
  END IF;
END $$;

-- keep updated_at fresh
DROP TRIGGER IF EXISTS trg_legal_package_requests_updated_at ON public.legal_package_requests;
CREATE TRIGGER trg_legal_package_requests_updated_at
  BEFORE UPDATE ON public.legal_package_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_legal_service_packages_updated_at ON public.legal_service_packages;
CREATE TRIGGER trg_legal_service_packages_updated_at
  BEFORE UPDATE ON public.legal_service_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
