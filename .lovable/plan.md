## Goal

Seed 3 additional realistic listings per quick-filter category (Properties, Motorcycles, Bicycles, Workers) with **3 photos each**, and 3 additional realistic client profiles (the "users" surfaced on the Owner side) with **3 photos each**, covering Bali, Tulum, Miami, NYC, Russia, Spain, Italy, France, Brazil, Argentina, Mexico, Colombia, Venezuela vibes.

Existing seeded categories already have multiple entries — we are adding 3 more per category, not replacing.

## Scope

**Listings table (4 categories × 3 = 12 new listings)**
- Property: 3 new (e.g. Tulum jungle villa, Bali Canggu loft, Miami Brickell condo)
- Motorcycle: 3 new (e.g. Vespa GTS 300 Italy, Triumph Bonneville UK, Royal Enfield Himalayan)
- Bicycle: 3 new (e.g. Cannondale Topstone gravel, Pinarello road, Vanmoof S5 e-bike)
- Worker: 3 new (e.g. Brazilian fitness coach in Tulum, Argentine chef in Miami, Spanish architect in Bali)

Each listing includes:
- `images` jsonb array with **exactly 3** Unsplash CDN URLs (`?auto=format&fit=crop&q=80&w=1200`)
- `is_active=true`, `status='active'`, sensible price/currency, address, neighborhood
- `owner_id = '00000000-0000-0000-0000-000000000001'` (matches existing seed system owner)
- Stable hardcoded UUIDs so re-running migration is idempotent (`ON CONFLICT (id) DO NOTHING`)

**Client profiles (3 new users surfaced on Owner side)**
3 new rows in `client_profiles` representing diverse Latin/European/Asian-coastal vibes (e.g. Brazilian creative in Tulum, Italian designer in Bali, Colombian dev in Miami). Each gets:
- `profile_images` jsonb with **3** realistic portrait Unsplash URLs
- `name`, `age`, `bio`, `nationality`, `country`, `city`, `neighborhood`, `languages`, `interests`, `roommate_available=true`
- `user_id` = stable seeded UUID (no auth.users FK conflict — `user_id` column allows arbitrary uuid; existing seeds work the same way)

## Implementation

**Single new migration file**: `supabase/migrations/<timestamp>_seed_diverse_listings_and_profiles.sql`

Structure:
```sql
-- 12 listings (3 per category) with stable UUIDs and 3 images each
INSERT INTO public.listings (id, owner_id, title, description, price, currency,
  images, status, is_active, category, listing_type, address, neighborhood,
  property_type, beds, baths, square_footage, amenities)
VALUES (...), (...), ... 
ON CONFLICT (id) DO NOTHING;

-- 3 client_profiles for owner-side discovery
INSERT INTO public.client_profiles (user_id, name, age, bio, gender, nationality,
  country, city, neighborhood, languages, interests, profile_images,
  roommate_available, occupation)
VALUES (...), (...), (...)
ON CONFLICT DO NOTHING;
```

All photos use Unsplash hot-link CDN URLs (already the pattern in the existing seed), so no storage upload step needed and the carousel/tap-to-change-photo behavior gets exercised immediately (3 photos per card).

## What does NOT change

- No code changes to `useListings`, `SwipessSwipeContainer`, swipe physics, or carousel logic — all data-only.
- No changes to category routing — `get_smart_listings` already filters by `category` correctly.
- No new tables, no RLS changes.

## Acceptance

- Properties deck shows 3 new realistic global-vibe listings, each with 3 swipeable photos.
- Motorcycle / Bicycle / Worker decks each have 3 new entries with 3 photos.
- Owner-side user discovery shows 3 new diverse client profiles, each with 3 portraits.
- Tapping the card edges cycles through the 3 photos as designed.
- Re-running the migration is a no-op (idempotent via `ON CONFLICT`).