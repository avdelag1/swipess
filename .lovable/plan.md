

# 9 Feature Build Plan for SwipesS

## Features to Build (all except #8 - AI Move-In Concierge)

### Phase 1: Database-First (Migrations)

**New tables needed:**

1. `neighborhood_data` — stores zone info, avg pricing, density scores for heat map
2. `price_history` — monthly price snapshots per neighborhood for seasonal tracker
3. `local_intel_posts` — curated local news/events feed
4. `escrow_deposits` — deposit tracking between client and owner
5. `listing_availability` — date ranges for smart availability calendar
6. `roommate_preferences` — lifestyle matching data for roommate feature

**Table modifications:**
- `listings` — add `available_from`, `available_to` date columns
- `owner_profiles` — `verified_owner` already exists, add `verification_submitted_at`, `verification_documents` jsonb

### Phase 2: Features Breakdown

---

#### 1. Neighborhood Heat Map
**New files:**
- `src/pages/NeighborhoodMap.tsx` — full-page interactive map view
- `src/components/NeighborhoodHeatMap.tsx` — the map component using CSS grid zones (no external map library needed, styled zone cards)
- `src/hooks/useNeighborhoodData.ts` — fetches zone data from `neighborhood_data` table

**Approach:** Not a Google Maps integration (would need API key). Instead, a visually striking grid/card layout of Tulum zones (Aldea Zamá, La Veleta, Region 15, etc.) with color-coded pricing indicators, listing count badges, and tap-to-filter into the swipe deck. Think "zone explorer" not "Google Maps clone."

**DB:** Seed `neighborhood_data` with Tulum zones, avg prices, and descriptions.

---

#### 2. Virtual Property Tours (Video Walkthroughs)
**What exists:** `video_url` on listings, `ListingVideoUpload`, `VideoCropper`, `listing-videos` bucket.

**What's missing:** A TikTok-style vertical scroll viewer for browsing videos.

**New files:**
- `src/components/VideoTourFeed.tsx` — vertical swipeable video feed (framer-motion)
- `src/pages/VideoTours.tsx` — page routing
- Add video tour button to swipe cards and insights modal

**Approach:** Query listings that have `video_url`, display in a full-screen vertical scroll feed. Tap to view listing details. Auto-play/pause on scroll visibility.

---

#### 3. AI Roommate Matching
**New files:**
- `src/pages/RoommateMatching.tsx` — discovery page
- `src/components/RoommateMatchCard.tsx` — swipe card for potential roommates
- `src/hooks/useRoommateMatching.ts` — matching algorithm based on client_profiles data

**Approach:** Uses existing `client_profiles` table (has lifestyle_tags, work_schedule, smoking, noise_tolerance, cleanliness_level, interests). Build a compatibility score algorithm comparing two client profiles. New page accessible from bottom nav or settings. Swipe interface reusing `SimpleSwipeCard` patterns.

**DB:** New `roommate_preferences` table for opt-in + preferred budget split, move-in timeline. New `roommate_matches` table for mutual likes.

---

#### 4. Seasonal Price Tracker
**New files:**
- `src/pages/PriceTracker.tsx` — chart page
- `src/components/PriceHistoryChart.tsx` — recharts line/area chart
- `src/hooks/usePriceHistory.ts` — fetches from `price_history` table

**Approach:** Show historical and current avg prices per neighborhood using Recharts (already installed). Seed with realistic Tulum pricing data. Filter by property type, neighborhood, beds.

**DB:** `price_history` table with `neighborhood`, `month`, `year`, `avg_price`, `listing_count`, `property_type`.

---

#### 5. Document Vault
**What exists:** `legal_documents` table, `legal-documents` bucket (private), `LegalDocumentsDialog.tsx` with upload/view/delete.

**What's missing:** Dedicated full page, folder organization, contract integration.

**New files:**
- `src/pages/DocumentVault.tsx` — full page with tabs (Contracts, IDs, Fideicomiso, Other)
- Enhance `LegalDocumentsDialog.tsx` with category filtering and search

**Approach:** Mostly UI enhancement. Add document categories as tabs, link existing `digital_contracts` into the vault view, add a "quick upload" FAB button.

---

#### 6. Owner Verified Badge
**What exists:** `verified_owner` boolean on `owner_profiles`, `legal_documents` table with document types including `ownership_deed`.

**New files:**
- `src/components/VerificationRequestFlow.tsx` — step-by-step verification submission
- `src/components/VerifiedOwnerBadge.tsx` — the badge component (already partially in TrustSignals)

**Approach:** Owner uploads ownership deed or escritura → document status goes to `pending` → badge shows "Verification Pending" → admin verifies → `verified_owner` flips to true → gold badge appears on all their listings. Uses existing `legal_documents` infrastructure.

---

#### 7. Local Intel Feed
**New files:**
- `src/pages/LocalIntel.tsx` — scrollable feed page
- `src/components/IntelCard.tsx` — individual post card
- `src/hooks/useLocalIntel.ts` — fetch posts

**DB:** `local_intel_posts` table with `title`, `content`, `category` (infrastructure, events, coworking, dining, safety), `neighborhood`, `image_url`, `source_url`, `published_at`.

**Approach:** Curated feed of local updates. Categories as horizontal filter chips. Cards with image, title, snippet, category badge. Initially seeded with Tulum-relevant content. Owners can submit intel posts (community-driven).

---

#### 9. Deposit Escrow (UI + Tracking)
**New files:**
- `src/components/DepositEscrowTracker.tsx` — status timeline component
- `src/pages/EscrowDashboard.tsx` — view active deposits

**DB:** `escrow_deposits` table with `contract_id`, `client_id`, `owner_id`, `amount`, `currency`, `status` (held/released/disputed), `held_at`, `released_at`.

**Approach:** No actual payment processing (would need Stripe Connect). Instead, build the tracking UI and status flow. When a contract is signed, an escrow record is created. Both parties can see status. Owner confirms move-in → deposit status changes to "released." This is the tracking layer; actual money transfer is manual/external for now, with a "Connect Payment" placeholder for future Stripe integration.

---

#### 10. Smart Availability Calendar
**What exists:** `available_from` referenced in some listing preview code, availability status dropdown on PropertyManagement.

**New files:**
- `src/components/AvailabilityCalendar.tsx` — visual calendar component (react-day-picker already installed)
- `src/components/filters/AvailabilityFilter.tsx` — date range filter for swipe deck

**DB:** Add `available_from` and `available_to` columns to `listings` table.

**Approach:** Owners set available date ranges on their listings. Clients filter the swipe deck by their desired move-in date. Uses react-day-picker (already installed). Calendar shows booked vs available periods.

---

### Phase 3: Navigation Integration

- Add new pages to router
- Add "Explore" section to bottom nav or settings with links to: Heat Map, Video Tours, Price Tracker, Local Intel, Roommate Matching
- Add Document Vault and Escrow to existing owner/client settings menus

### Implementation Order (by dependency)

1. **DB migrations** — all tables and columns first
2. **Owner Verified Badge** — smallest, builds on existing infra
3. **Document Vault** — extends existing component
4. **Smart Availability Calendar** — extends listings
5. **Neighborhood Heat Map** — new page, seeded data
6. **Seasonal Price Tracker** — new page, seeded data
7. **Virtual Property Tours** — new page, uses existing video infra
8. **Local Intel Feed** — new page + table
9. **AI Roommate Matching** — most complex, new matching logic
10. **Deposit Escrow** — depends on contracts flow

### Technical Notes

- All new pages follow existing patterns: `useAuth` guard, `DashboardLayout` wrapper, theme-aware styling
- All new tables get RLS policies scoped to authenticated users
- No new external APIs or secrets needed
- Recharts (installed) used for price charts
- react-day-picker (installed) used for calendar
- framer-motion (installed) used for video feed animations
- Total estimated: ~15-20 new files, 6 DB migrations, 5-8 modified files

