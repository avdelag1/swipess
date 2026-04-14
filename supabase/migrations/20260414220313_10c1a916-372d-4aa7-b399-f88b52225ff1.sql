
-- 1. business_partners
CREATE TABLE public.business_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  category text NOT NULL DEFAULT 'general',
  description text,
  discount_percent integer NOT NULL DEFAULT 10,
  custom_discount_text text,
  location text,
  latitude double precision,
  longitude double precision,
  website_url text,
  whatsapp text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active partners"
  ON public.business_partners FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert partners"
  ON public.business_partners FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partners"
  ON public.business_partners FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partners"
  ON public.business_partners FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_partners_updated_at
  BEFORE UPDATE ON public.business_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. discount_offers
CREATE TABLE public.discount_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_percent integer NOT NULL DEFAULT 10,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active offers"
  ON public.discount_offers FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert offers"
  ON public.discount_offers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offers"
  ON public.discount_offers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offers"
  ON public.discount_offers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. discount_redemptions
CREATE TABLE public.discount_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.discount_offers(id) ON DELETE SET NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  amount_saved numeric,
  business_note text,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'approved'
);

ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.discount_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT is service-role only (edge function), no public INSERT policy

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_redemptions;
