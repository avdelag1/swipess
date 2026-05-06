-- Price updates for Swipess Plus tiers (match App Store pricing)
UPDATE public.subscription_packages
SET price = 29.99
WHERE name ILIKE '%plus%monthly%' OR name ILIKE 'Swipess Plus Monthly';

UPDATE public.subscription_packages
SET price = 111.99
WHERE name ILIKE '%plus%6%' OR name ILIKE '%plus%semi%' OR name ILIKE '%plus%semestral%';

UPDATE public.subscription_packages
SET price = 149.99
WHERE name ILIKE '%plus%year%' OR name ILIKE '%plus%annual%';

-- Event promotion requests (submission + admin approval)
CREATE TABLE IF NOT EXISTS public.event_promotion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE,
  city TEXT,
  photo_url TEXT,
  link TEXT,
  description TEXT,
  requested_tier TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_promotion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own promotion requests"
  ON public.event_promotion_requests FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own promotion requests"
  ON public.event_promotion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending requests"
  ON public.event_promotion_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins update any promotion request"
  ON public.event_promotion_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_event_promotion_requests_updated_at
  BEFORE UPDATE ON public.event_promotion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Active promotions backed by Apple IAP
CREATE TABLE IF NOT EXISTS public.event_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.event_promotion_requests(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  original_transaction_id TEXT UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own promotions"
  ON public.event_promotions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update promotions"
  ON public.event_promotions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_event_promotions_user_active ON public.event_promotions(user_id, active);
CREATE INDEX IF NOT EXISTS idx_event_promotion_requests_status ON public.event_promotion_requests(status);