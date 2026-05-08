-- Category photos: admin-managed photo pool per quick-filter category card
CREATE TABLE public.category_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_category_photos_category ON public.category_photos(category_id, is_active, sort_order);

ALTER TABLE public.category_photos ENABLE ROW LEVEL SECURITY;

-- Public can read active photos (cards are visible to everyone)
CREATE POLICY "Anyone can view active category photos"
ON public.category_photos
FOR SELECT
USING (is_active = true);

-- Only admins can insert
CREATE POLICY "Admins can insert category photos"
ON public.category_photos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update category photos"
ON public.category_photos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete category photos"
ON public.category_photos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_category_photos_updated_at
BEFORE UPDATE ON public.category_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();