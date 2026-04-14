

## Resident Perks & Discount History -- Full Feature Plan

### Overview
Build a consumer-facing "Perks" section where verified residents show a QR code at partner businesses, receive discounts, and track their savings history in real time.

### Database (3 new tables + 1 realtime)

**`business_partners`** -- partner businesses offering discounts
- id (uuid PK), name, logo_url, category, description, discount_percent (int), custom_discount_text, location, latitude, longitude, website_url, whatsapp, is_active (bool default true), created_at, updated_at
- RLS: SELECT open to all authenticated; INSERT/UPDATE/DELETE admin-only via `has_role()`

**`discount_offers`** -- specific offers a business provides
- id (uuid PK), business_id (FK), title, description, discount_percent, valid_from, valid_until, is_active, created_at
- RLS: SELECT open to authenticated; mutations admin-only

**`discount_redemptions`** -- every time a user redeems a discount
- id (uuid PK), user_id (uuid), business_id (FK), offer_id (FK nullable), discount_percent, amount_saved (numeric nullable), business_note (text nullable), redeemed_at (timestamptz default now()), status (text default 'approved')
- RLS: SELECT where `auth.uid() = user_id`; INSERT via service role (edge function) only
- Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE discount_redemptions;`

### Edge Function: `validate-resident-qr`
Called by the business admin scanner. Receives `{ user_id, business_id, discount_percent, amount_saved?, note? }`. Validates user exists + is verified, inserts into `discount_redemptions`, returns success. Uses service role key.

### New Pages & Components

**Route**: `/client/perks` (inside PersistentDashboardLayout)

1. **`src/pages/ClientPerks.tsx`** -- main entry
   - Hero card with user's QR code (tap to expand full-screen)
   - Stats row: total saved, discounts used, businesses visited, current streak
   - "Active Offers" horizontal carousel from `discount_offers`
   - Link to full history

2. **`src/components/perks/PerksDashboard.tsx`** -- the hero + stats layout

3. **`src/components/perks/ResidentQRModal.tsx`** -- full-screen QR modal
   - Large QR encoding user's profile UUID
   - 60-second countdown timer, auto-regenerates
   - Realtime subscription on `discount_redemptions` filtered to user
   - Success animation (confetti + checkmark) when new row appears

4. **`src/components/perks/BusinessList.tsx`** -- searchable/filterable partner list
   - Category filter chips (cafes, gyms, services, etc.)
   - Each card: logo, name, discount %, "Show QR" button

5. **`src/components/perks/DiscountHistory.tsx`** -- timeline of redemptions
   - Sorted by date, shows business name, discount %, amount saved, note
   - Export button (generates CSV via client-side blob)

6. **`src/components/perks/BusinessDetailSheet.tsx`** -- bottom sheet for business detail

### Navigation Integration
- Add to `BottomNavigation.tsx` client items: `{ id: 'perks', icon: BadgePercent, label: 'Perks', path: '/client/perks' }`
- Add lazy route in `App.tsx` inside the protected dashboard layout

### Realtime Flow
1. User opens QR modal
2. Business scans QR (gets user_id), calls `validate-resident-qr` edge function
3. Edge function inserts `discount_redemptions` row
4. User's app receives realtime INSERT event, triggers confetti + updates history

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/pages/ClientPerks.tsx` | Create |
| `src/components/perks/PerksDashboard.tsx` | Create |
| `src/components/perks/ResidentQRModal.tsx` | Create |
| `src/components/perks/BusinessList.tsx` | Create |
| `src/components/perks/DiscountHistory.tsx` | Create |
| `src/components/perks/BusinessDetailSheet.tsx` | Create |
| `src/components/BottomNavigation.tsx` | Add perks nav item |
| `src/App.tsx` | Add lazy route |
| Migration | 3 new tables + realtime publication |
| Edge function `validate-resident-qr` | Create |

### Design
- Same premium dark/light theme tokens as existing app
- Framer Motion for QR reveal, card transitions, confetti
- QR generated client-side via `qrcode` npm package (lightweight)
- Fully responsive, Capacitor-ready (no camera needed on consumer side)

### Dependencies
- `qrcode` (or `qrcode.react`) for QR generation -- small, no native deps

