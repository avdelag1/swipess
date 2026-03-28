
-- =====================================================
-- MIGRATION: Expert Knowledge Table (Business Directory Edition)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expert_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  location text,
  website_url text,
  instagram_handle text,
  whatsapp text,
  content text NOT NULL,
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

-- Add GIN index for fast text search on content and title
CREATE INDEX IF NOT EXISTS expert_knowledge_search_idx ON public.expert_knowledge USING GIN (to_tsvector('english', title || ' ' || content));

-- =====================================================
-- SEED DATA: Tulum Hotel Zone Pack (March 2026)
-- =====================================================

INSERT INTO public.expert_knowledge (title, category, location, website_url, instagram_handle, whatsapp, content, metadata)
VALUES
('Papaya Playa Project', 'Beach Club / Hotel', 'Hotel Zone (various Km)', 'https://papayaplayaproject.com', '@papayaplayaproject', '', 'Iconic party spot, full moon events, free beach corridor', '{"free_access": true, "min_spend": "80-200 USD"}'),
('Bagatelle Tulum', 'Beach Club', 'Km 8', '', '@bagatelle.tulum', '+52 984 182 4701', 'Luxury French-Mex, champagne & DJs, high-end', '{"min_spend": "170-250 USD"}'),
('Gitano Beach', 'Beach Club', 'Km 9.5', '', '@gitanobeach', '', 'Barefoot disco, gypset glamour', '{"min_spend": "50-100 USD"}'),
('Distrito Panamera / Panamera', 'Beach Club / Hotel', 'Km 8.5', '', '', '+52 998 109 2540', 'Retro Riviera, checkered pool, free access participant', '{"min_spend": "50-100 USD"}'),
('Nomade Tulum', 'Hotel / Beach Club', 'Km 10.5', 'https://nomadetulum.com', '@nomadetulum', '', 'Eco-wellness, La Popular restaurant, free access', '{"min_spend": "90-140 USD"}'),
('Vagalume', 'Beach Club', 'Km 8.5', '', '', '', 'Burning Man cabaret, flame shows, free access', '{"min_spend": "50-100 USD"}'),
('Be Tulum / Mare''Zia', 'Hotel / Beach Club', 'Km 10', 'https://betulum.com', '@betulumhotel', '+52 984 980 0640', 'Eco-luxury, Mediterranean food', '{"min_spend": "95-140 USD"}'),
('La Zebra', 'Beach Club / Hotel', 'Km 8.2', '', '@lazebratulum', '+52 984 115 4726', 'Family-friendly, salsa Sundays', '{"free_access": true, "min_spend": "50-100 USD"}'),
('Kanan Tulum / Kanan Beach Club', 'Hotel / Beach Club', 'Km 7.5-8.5', '', '@kanantulum', '+52 984 233 787', 'Adults-only treehouses', '{"free_access": true, "min_spend": "50-100 USD"}'),
('Ziggy''s Beach Club', 'Beach Club', 'Km 7.5', 'https://ziggybeachtulum.com', '@ziggybeachtulum', '+52 984 157 4069', 'Classic calm Caribbean, live music', '{"min_spend": "45-80 USD"}'),
('Taboo Beach Club', 'Beach Club', 'Km 7', 'https://taboobeachclub.com.mx', '@taboobeachclub', '+52 998 690 0278', 'Luxury Mediterranean-Mex, high-energy', '{"min_spend": "150-220 USD"}'),
('Rosa Negra / Rosanegra', 'Beach Club', 'Km 7', '', '@rosanegra.tulum', '', 'Latin fusion, DJs, pool', '{"min_spend": "160-230 USD"}'),
('Ahau Tulum', 'Hotel / Beach Club', 'Km 7.5', '', '@ahautulum', '', 'Fresh local eats, yoga', '{"free_access": true, "min_spend": "50-90 USD"}'),
('Coco Tulum / Coco Unlimited', 'Hotel / Beach Club', 'Hotel Zone', '', '@cocotulum', '', 'Bohemian palapas, relaxed', '{"free_access": true, "min_spend": "40-80 USD"}'),
('Casa Malca', 'Hotel / Beach Club', 'Km 9.5', '', '@casamalca', '+52 984 135 1373', 'Art-focused luxury, former Escobar mansion', '{}'),
('Akiin Beach Club', 'Beach Club', 'Km 7.5-9.5', '', '@akiintulum', '', 'Bohemian-chic', '{"free_access": true}'),
('La Eufemia', 'Beach Club / Restaurant', 'Hotel Zone', '', '@laeufemiataqueria', '', 'Taqueria, kid-friendly, low-key', '{"free_access": true}'),
('Delek Tulum', 'Hotel / Beach Club', 'Hotel Zone', '', '@delektulum', '', 'Rustic luxury beachfront', '{"free_access": true}'),
('Ana y José', 'Hotel / Beach Club', 'Hotel Zone', '', '', '', 'Tropical gardens, laid-back', '{"free_access": true}'),
('Ikal Tulum', 'Hotel', 'Hotel Zone', '', '@ikaltulum', '', 'Mayan sanctuary, wellness', '{"free_access": true}'),
('Azulik', 'Hotel', 'Hotel Zone', 'https://azulik.com', '@azulik', '', 'Treehouse luxury, adults-only vibe', '{}'),
('Mia Tulum / Mia Restaurant & Beach Club', 'Beach Club / Restaurant', 'Hotel Zone', '', '@miatulum', '', 'Euro-Mexican cuisine', '{"min_spend": "~60 USD"}'),
('Tantra', 'Beach Club', 'Km 7', '', '', '+52 998 173 8691', 'Boho-chic party, plunge pools', '{}'),
('Casa Violeta', 'Hotel / Beach Club', 'Hotel Zone', '', '', '', 'Eco-chic boutique hotel', '{"free_access": true}'),
('Selina Tulum', 'Hotel / Beach Club', 'Hotel Zone', '', '', '', 'Coworking, yoga, beach vibe', '{"free_access": true}'),
('Dune Boutique Hotel', 'Hotel', 'Hotel Zone', '', '', '', 'Sophisticated beachfront stay', '{"free_access": true}'),
('Shambala Petit Hotel', 'Hotel', 'Hotel Zone', '', '', '', 'Yoga-focused retreat', '{"free_access": true}'),
('Cabañas La Luna', 'Hotel', 'Hotel Zone', '', '', '', 'Quaint beach cabins', '{"free_access": true}'),
('Aldea Tulum', 'Hotel', 'Hotel Zone', '', '', '', 'Luxury in the jungle', '{"free_access": true}'),
('Hotel Nest / The Nest', 'Hotel', 'Hotel Zone', '', '', '', 'Authentic Tulum minimalist luxury', '{"free_access": true, "notes": "Adults-only"}'),
('Hotel Sana', 'Hotel', 'Hotel Zone', '', '@hotel_sana_tulum', '', 'Wellness and luxury', '{"free_access": true}'),
('Dos Ceibas', 'Hotel', 'Hotel Zone', '', '', '', 'Eco-friendly beach hotel', '{"free_access": true}'),
('Villa Alquimia', 'Hotel', 'Hotel Zone', '', '', '', 'Stunning beach views', '{"free_access": true}'),
('Blue Venado', 'Beach Club', 'Hotel Zone', '', '', '', 'Secluded and pristine', '{"free_access": true}'),
('FaraFara', 'Beach Club', 'Hotel Zone', '', '', '', 'Music and beach fun', '{"free_access": true}'),
('Casa Gitano', 'Hotel / Beach Club', 'Hotel Zone', '', '@casagitano', '', 'Gypsy lifestyle boutique', '{"free_access": true}'),
('Raw Love', 'Restaurant (at Ahau)', 'Km 7.5', '', '@rawlove_tulum', '', 'Organic vegan, beachfront', '{}')
ON CONFLICT (id) DO NOTHING;
