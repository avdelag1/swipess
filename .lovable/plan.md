## Scope

Three things, all triggered from `/owner/dashboard` and `/client/liked-properties`:

1. Bring back the **GPS Detect** button on the kilometer/radar slider.
2. Replace gray pill buttons with white-on-light / glass-on-dark across **client + owner Likes** pages.
3. Investigate why the user sees what they call "mock listings" instead of their original ones.

---

## 1. Radar GPS button — `src/components/swipe/DistanceSlider.tsx`

Currently the header row only renders the `MapPin` *icon* (decorative) and the km readout. The clickable detect-location button was removed. The component already receives `onDetectLocation`, `detecting`, `detected` as props — they're unused.

Plan: turn the existing `MapPin` chip into a proper **button** placed between "Scanning <Category>" label and the km readout (centered). It will:

- Call `onDetectLocation()` on press, with haptic.
- Show three visual states: idle (MapPin), detecting (spinner), detected (Crosshair / pulse ring).
- Theme-aware: white surface + black icon + soft shadow on light; dark glass + cyan icon on dark. Uses semantic tokens, no hardcoded grays.
- 40px circular target, accessible label, `aria-pressed={detected}`.

No layout shift — replaces the existing decorative icon container.

---

## 2. Likes pages — gray-button cleanup

Files:
- `src/pages/ClientLikedProperties.tsx` (client side)
- `src/components/LikedClients.tsx` (owner side)
- `src/components/PremiumLikedCard.tsx` (shared card; has `bg-secondary`, `bg-muted`, `border-border` chips that look gray on light)

Changes (light theme = "white filter"):
- Category pills, sort pills, search bar, refresh button: `bg-white` + `border-black/8` + soft shadow `0 4px 12px rgba(0,0,0,0.04)` instead of the current `bg-black/5 / bg-white/[0.04]` gray.
- Selected state stays bold black-on-white.
- Inside `PremiumLikedCard`: the metadata chips (`bg-secondary border-border`) and secondary action button (`bg-secondary hover:bg-muted`) → switch to `bg-white border-black/8 shadow-sm` on light, keep dark variant unchanged.
- Empty/skeleton placeholders: replace `bg-muted` with `bg-black/[0.04]` on light so they don't read as a flat gray slab.

Owner Likes (`LikedClients.tsx`) gets the same pill / search / button treatment so client + owner stay visually consistent.

---

## 3. "I see mock data instead of my listings"

DB check (already run): `listings` table has 20 active rows. Many of them have `owner_id = NULL` — these are seeded demo rows (Brompton, Harley, BMW R1250GS, Interior Designer, etc.) created on 2026-02-13. Real user listings (incl. "Luv-a-Tulum Penthouse" implied in screenshot) exist with proper `owner_id`.

So the user's "real" listings are still in the DB; what they see as "mock" is the **seed data mixed in** with real ones (no `owner_id`). Nothing is broken in the data layer — the discovery feed is just including the seeds.

Plan: in `useListings.tsx` (and the smart matching listing fetch path), filter out rows with `owner_id IS NULL` so only real, owned listings are shown in the swipe deck and Likes feed. This makes the demo seeds invisible to end users without deleting them.

```ts
// src/hooks/useListings.tsx — add to the active-listings query
.eq('status','active')
.not('owner_id','is',null)
```

Same `.not('owner_id','is',null)` filter added wherever the swipe deck or owner feed reads from `listings` (smart matching).

If, after that, the user still sees fewer listings than expected, the next step is to look at their specific `owner_id` and confirm the rows are still there — but based on the DB snapshot there are real listings with non-null owners ready to display.

---

## Out of scope

- Not deleting seed rows (keeps preview demos working for new accounts).
- Not changing radar physics, swipe logic, or routing.

---

## Files to edit

```text
src/components/swipe/DistanceSlider.tsx       (GPS button)
src/pages/ClientLikedProperties.tsx           (white pills, search, refresh)
src/components/LikedClients.tsx               (owner side parity)
src/components/PremiumLikedCard.tsx           (chips + secondary action)
src/hooks/useListings.tsx                     (filter owner_id NULL seeds)
src/hooks/smartMatching/useSmartListingMatching.tsx  (same filter)
```
