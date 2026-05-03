
-- =====================================================
-- MIGRATION: Nexus Database Consolidation & Featured Expansion
-- =====================================================

-- 1. Hardening expert_knowledge to support AI Concierge features
-- We add columns to match the concierge_knowledge schema for seamless porting.
ALTER TABLE public.expert_knowledge 
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Create Featured Listings Table (Nexus Dashboard Slot System)
CREATE TABLE IF NOT EXISTS public.featured_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  slot text NOT NULL DEFAULT 'top',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, slot)
);

ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view featured listings" ON public.featured_listings FOR SELECT USING (true);

-- 3. Porting Tulum Business Database to expert_knowledge
-- This covers the full list requested by the user.
INSERT INTO public.expert_knowledge (category, title, content, google_maps_url, phone, website_url, tags, language)
VALUES
-- RESTAURANTS & BEACH CLUBS
('Restaurant / Beach Club', 'Hartwood Tulum', 'Wood-fired Mexican (legendary). Reservations: Email exactly 1 month ahead; walk-ins possible after 3 PM.', 'Carretera Tulum-Boca Paila Km 7.6, Zona Hotelera', '', 'https://www.hartwoodtulum.com', '{"@hartwoodtulum", "reservations"}', 'en'),
('Restaurant / Beach Club', 'Arca Tulum', 'Contemporary Mexican / wood-fired fine dining. Book 2–3 weeks ahead via WhatsApp or email.', 'Carretera Tulum-Boca Paila Km 7.6, Zona Hotelera', '+52 984 177 2231', 'https://arcatulum.com', '{"@arcatulum", "fine-dining"}', 'en'),
('Restaurant / Beach Club', 'Casa Banana', 'Argentinian steakhouse / jungle vibe. Reservations recommended.', 'Carretera Tulum-Boca Paila Km ~8, Zona Hotelera', '', '', '{"@casabananatulum"}', 'en'),
('Restaurant / Beach Club', 'Mezzanine Tulum', 'Boutique hotel + Thai restaurant (oceanfront, adults-only).', 'Km 4, Carretera Tulum-Boca Paila', '+52 984 115 4728', 'https://mezzaninetulum.com', '{"@mezzaninetulum", "thai"}', 'en'),
('Restaurant / Beach Club', 'Cinco Tulum', 'Restaurant + Beach Club + Glamping (Jaguar Park).', 'Km 1.9, Carretera Tulum-Boca Paila', '+52 984 202 3344', 'https://cincotulum.com', '{"@cincotulum"}', 'en'),
('Restaurant / Beach Club', 'La Eufemia', 'Beach taquería / Mexican street-food vibe. Walk-ins common.', 'Beachfront, south end of hotel zone', '', '', '{"@laeufemiataqueria", "tacos"}', 'en'),
('Restaurant / Beach Club', 'Mi Amor', 'Hotel + Restaurant/Bar (beachfront).', 'Km 4.1, Carretera Tulum-Boca Paila', '+52 984 115 4728', 'https://tulumhotelmiamor.com', '{"@miamortulum"}', 'en'),
('Restaurant / Beach Club', 'Papaya Playa Project', 'Beach Club + Restaurant + Hotel (iconic party spot).', 'Km 4.5, Carretera Tulum-Boca Paila', '+52 984 116 3774', 'https://www.papayaplayaproject.com', '{"@papayaplayaproject", "party"}', 'en'),
('Restaurant / Beach Club', 'Gitano', 'Restaurant + Beach Club. Barefoot disco, gypset glamour.', 'Km 7.5, Carretera Tulum-Boca Paila', '', 'https://www.gitano.com', '{"@gitano", "disco"}', 'en'),
('Restaurant / Beach Club', 'Rosa Negra', 'Steakhouse / Fine dining.', 'Carretera Tulum-Boca Paila', '+52 984 980 0725', 'https://www.rosanegra.com.mx', '{"luxury"}', 'en'),
('Beach Club', 'Playa Pescadores', 'Beach Club (iconic, boat tours).', 'South beach zone', '', 'https://www.playapescadorestulum.com', '{"boats"}', 'en'),
-- HOTELS
('Hotel', 'Maria del Mar Tulum', 'Boutique adults-only hotel on the beach road.', 'Km 3.5, Carretera Tulum-Boca Paila', '+52 984 745 4627', 'https://mariadelmartulum.com', '{"boutique"}', 'en'),
('Hotel', 'IKAL Tulum Hotel', 'Mayan sanctuary, wellness retreats and events.', 'Playa Maya / Parque Nacional El Jaguar', '+52 984 146 0349', 'https://www.ikaltulumhotel.com', '{"wellness"}', 'en'),
('Hotel', 'Sana Tulum', 'Wellness and luxury beachfront hotel.', 'Km 10, Beachfront', '+52 984 745 2107', 'https://www.sanatulum.com', '{"luxury"}', 'en'),
('Hotel', 'BE Destination Tulum (Be Tulum)', 'Eco-luxury, Mediterranean food.', 'Km 10, Zona Hotelera', '+52 984 980 0678', 'https://www.betulum.com', '{"eco-luxury"}', 'en'),
('Hotel', 'Radhoo Tulum', 'Adults-only bohemian luxury.', 'Km 8.7, Zona Hotelera', '+52 984 217 5090', 'https://www.radhootulum.com', '{"boho"}', 'en'),
('Hotel', 'Habitas Tulum (Our Habitas)', 'Eco-luxury hotel (adults-focused).', 'Km 4.5, Av. Boca Paila', '+52 984 401 0390', 'https://www.ourhabitas.com/tulum', '{"sustainable"}', 'en'),
('Hotel', 'Azulik', 'Luxury eco-resort + Art/Wellness.', 'Km 5, Carretera Tulum-Punta Allen', '+52 984 188 6192', 'https://azulik.com', '{"architecture"}', 'en'),
('Hotel', 'Casa Malca', 'Luxury hotel with art-focused vibes. Former Escobar mansion.', 'Km 9.5, Carretera Tulum-Boca Paila', '+52 984 135 1373', 'https://casamalca.com', '{"art"}', 'en'),
-- HOSTELS
('Hostel', 'Straw Hat Hostel & Rooftop Bar', 'Backpacker-friendly bar with a social rooftop.', 'Avenida Tulum 89, Tulum Centro', '', '', '{"backpackers"}', 'en'),
('Hostel', 'Che Tulum Hostel & Bar', 'Adults Only social hostel in Centro.', 'Tulum Centro', '', '', '{"social"}', 'en')
ON CONFLICT DO NOTHING;

-- 4. Linking Featured Listings to the Slot System
INSERT INTO public.featured_listings (listing_id, slot)
VALUES
  ('f1e1b1a1-1111-4444-a1a1-111111111111', 'top'),
  ('f2e2b2a2-2222-4444-b2b2-222222222222', 'top'),
  ('f3e3b3a3-3333-4444-c3c3-333333333333', 'top'),
  ('f4e4b4a4-4444-4444-d4d4-444444444444', 'top')
ON CONFLICT (listing_id, slot) DO NOTHING;

-- 5. Cleanup redundant tables
-- Since we have consolidated into expert_knowledge, concierge_knowledge is no longer needed.
DROP TABLE IF EXISTS public.concierge_knowledge CASCADE;
