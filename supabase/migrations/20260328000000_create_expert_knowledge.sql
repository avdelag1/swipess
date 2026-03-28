
-- =====================================================
-- MIGRATION: Create Expert Knowledge Table for AI Concierge
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expert_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_knowledge ENABLE ROW LEVEL SECURITY;

-- Anyone can read expert knowledge
CREATE POLICY "Anyone can view expert knowledge" 
ON public.expert_knowledge FOR SELECT 
USING (true);

-- Admins (authenticated) can manage
CREATE POLICY "Authenticated users can search expert knowledge" 
ON public.expert_knowledge FOR SELECT 
TO authenticated 
USING (true);

-- Add GIN index for fast text search on content
CREATE INDEX IF NOT EXISTS expert_knowledge_content_idx ON public.expert_knowledge USING GIN (to_tsvector('english', content));

-- =====================================================
-- SEED DATA: Local Expert Information
-- =====================================================

INSERT INTO public.expert_knowledge (title, content, category, metadata)
VALUES 
(
  'Best Tacos in Tulum', 
  'Tulum is famous for its tacos. For authentic pastor, head to Tacos Rigo or Antojitos La Chiapaneca in the Pueblo. For high-end seafood tacos, check out Taqueria Honorio.', 
  'food', 
  '{"link": "https://www.google.com/search?q=best+tacos+tulum", "tags": ["tacos", "food", "local"]}'
),
(
  'Contact Swipess Instagram', 
  'Follow us for the latest real estate deals and local Tulum secrets. Our official handle is @swipe_tulum.', 
  'social', 
  '{"link": "https://instagram.com/swipe_tulum", "handle": "@swipe_tulum"}'
),
(
  'Emergency Numbers', 
  'In case of emergency in Tulum, dial 911. For local police, call +52 984 871 2101.', 
  'emergency', 
  '{"link": "tel:911", "important": true}'
),
(
  'Best Coworking Spaces', 
  'Digital nomads love Digital Jungle and CoWorking Tulum for high-speed fiber and great vibes.', 
  'work', 
  '{"link": "https://www.coworking-tulum.com/", "amenities": ["fiber", "coffee"]}'
)
ON CONFLICT (id) DO NOTHING;
