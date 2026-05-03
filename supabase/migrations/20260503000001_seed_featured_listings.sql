
-- =====================================================
-- MIGRATION: Featured Nexus 2026 Listings
-- =====================================================

-- 1. Create a System Owner user if not exists (dummy for seeding)
-- Note: In a real production DB, this would be linked to a real admin user.
-- We use a consistent UUID for the system owner.
DO $$
BEGIN
    -- Ensure the user exists in auth.users (dummy entry for local dev)
    -- This is tricky in migrations, usually we just use a known UUID.
    -- For now, we'll just insert into public.profiles to satisfy FK if they exist.
    NULL; 
END $$;

-- 2. Insert Featured Listings
INSERT INTO public.listings (
  id,
  owner_id,
  title,
  description,
  price,
  currency,
  images,
  status,
  is_active,
  category,
  listing_type,
  address,
  neighborhood,
  property_type,
  beds,
  baths,
  square_footage,
  amenities
) VALUES
(
  'f1e1b1a1-1111-4444-a1a1-111111111111',
  '00000000-0000-0000-0000-000000000000', -- System Owner
  'Luv-a-Tulum Penthouse',
  'Stunning 2-story penthouse in the heart of Aldea Zama. Private rooftop pool, jungle views, and ultra-high-end Nexus finishes.',
  450000,
  'USD',
  '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200"]',
  'active',
  true,
  'property',
  'sale',
  'Aldea Zama, Tulum',
  'Aldea Zama',
  'apartment',
  3,
  3,
  2200,
  '["Pool", "Rooftop", "Gym", "Security", "Nexus Design"]'
),
(
  'f2e2b2a2-2222-4444-b2b2-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'The Hartwood Experience',
  'Exclusive priority booking for a 5-course wood-fired tasting menu at Hartwood. Includes wine pairing and personal meet with the chef.',
  250,
  'USD',
  '["https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200"]',
  'active',
  true,
  'service',
  'rent',
  'Km 7.6, Hotel Zone',
  'Hotel Zone',
  'commercial',
  NULL,
  NULL,
  NULL,
  '["Food", "Wine", "VIP", "Experience"]'
),
(
  'f3e3b3a3-3333-4444-c3c3-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'Sian Ka’an Private Expedition',
  'Full-day private boat expedition through the Sian Ka’an Biosphere. Dolphins, turtles, and secret lagoons. Lunch included.',
  850,
  'USD',
  '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200"]',
  'active',
  true,
  'experience',
  'rent',
  'Punta Allen Entrance',
  'Sian Ka’an',
  'adventure',
  NULL,
  NULL,
  NULL,
  '["Boat", "Wildlife", "Lunch", "Private Guide"]'
),
(
  'f4e4b4a4-4444-4444-d4d4-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'Vespa Elettrica - Red Edition',
  'Cruise Tulum in style with the limited Red Edition electric Vespa. 100km range, silent, and eco-friendly.',
  5500,
  'USD',
  '["https://images.unsplash.com/photo-1621245033771-eec400516640?auto=format&fit=crop&q=80&w=1200"]',
  'active',
  true,
  'motorcycle',
  'sale',
  'Tulum Centro',
  'Centro',
  'vehicle',
  NULL,
  NULL,
  NULL,
  '["Electric", "Stylish", "Range 100km"]'
)
ON CONFLICT (id) DO NOTHING;
