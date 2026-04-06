
CREATE TABLE public.concierge_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  content text NOT NULL,
  google_maps_url text,
  phone text,
  website_url text,
  tags text[] DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active knowledge"
ON public.concierge_knowledge FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can insert knowledge"
ON public.concierge_knowledge FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update knowledge"
ON public.concierge_knowledge FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete knowledge"
ON public.concierge_knowledge FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_concierge_knowledge_category ON public.concierge_knowledge(category);
CREATE INDEX idx_concierge_knowledge_search ON public.concierge_knowledge USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_concierge_knowledge_tags ON public.concierge_knowledge USING gin(tags);

CREATE TRIGGER update_concierge_knowledge_updated_at
BEFORE UPDATE ON public.concierge_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
