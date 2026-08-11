-- Allow promo submissions to include a commercial video URL (max 60s enforced in app).
ALTER TABLE public.business_promo_submissions
  ADD COLUMN IF NOT EXISTS video_url text;

COMMENT ON COLUMN public.business_promo_submissions.video_url IS
  'Optional commercial video URL for event promo review (app enforces ≤60s).';
