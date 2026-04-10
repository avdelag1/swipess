
-- Add unique constraint for upsert to work
ALTER TABLE public.likes 
  ADD CONSTRAINT likes_user_target_unique 
  UNIQUE (user_id, target_id, target_type);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id),
  rating integer NOT NULL DEFAULT 5,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);
