
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
  '{"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200"}',
  'active',
  true,
  'property',
  'buy',
  'Aldea Zama, Tulum',
  'Aldea Zama',
  'apartment',
  3,
  3,
  2200,
  '{"Pool", "Rooftop", "Gym", "Security", "Nexus Design"}'
)
ON CONFLICT (id) DO NOTHING;
