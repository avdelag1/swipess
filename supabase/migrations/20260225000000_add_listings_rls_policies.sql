-- Enable Row Level Security on listings table
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to view active listings
CREATE POLICY "Authenticated users can view active listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (status = 'active' AND is_active = true);

-- Allow owners to view all their own listings (including inactive/draft)
CREATE POLICY "Owners can view their own listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Only owners can insert listings they own
CREATE POLICY "Owners can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their own listings
CREATE POLICY "Owners can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can delete their own listings
CREATE POLICY "Owners can delete their own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
