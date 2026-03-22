

# Auto-Play Events Feed + Enhanced Button Connectivity

## What the user wants
1. **Auto-play mode** on the Eventos feed: a progress bar fills between category tabs, and when it completes, the feed auto-scrolls to the next event card with a smooth Ken Burns zoom transition. After the last card, it scrolls back to the top.
2. **Same zoom-in effect** applied to the CategorySwipeStack on the client dashboard — cards get a subtle slow zoom when they're the active/top card.
3. **All event buttons fully functional**: Like → persisted (already works), Chat → WhatsApp deep-link to organizer (not group chat), Share → native share with app invite link, Middle tap → opens insights overlay, More Info → opens detail page, Get Tickets → WhatsApp or external link.

---

## Step 1: Add Auto-Play Progress Bar to EventosFeed

**File**: `src/pages/EventosFeed.tsx`

- Add an `autoPlay` toggle state (default: true) and a `progress` state (0→100 over ~6 seconds per card).
- Replace the static progress dots (lines 740-755) with animated progress bars — each bar fills over the timer duration for its respective card.
- When progress hits 100%, smooth-scroll to the next card via `scrollRef.current.scrollTo({ top: nextIdx * clientHeight, behavior: 'smooth' })`.
- After the last event card, scroll back to top (loop).
- Pause auto-play on user touch/scroll (resume after 3s idle).
- Add a small play/pause toggle button in the header HUD.

**Progress bar design**: Instagram Stories style — thin bars across the top, the active one fills left-to-right with a white gradient. Completed bars are solid white/40, upcoming bars are white/15.

## Step 2: Ken Burns Zoom Effect on Active Event Card

**File**: `src/pages/EventosFeed.tsx` (EventCard component)

- The existing `scale: 1.06` animation on `isActive` already provides a slow zoom. Enhance it:
  - When a card becomes active, animate from `scale: 1` to `scale: 1.12` over the auto-play duration (6s).
  - Add a subtle `filter: brightness(1.05)` during the zoom for a cinematic warmth.

## Step 3: Same Zoom Effect on CategorySwipeStack

**File**: `src/components/CategorySwipeStack.tsx`

- Add a slow Ken Burns zoom to the top card's icon/background area — animate `scale` from 1 to 1.04 over 4s when it's the top card, giving it a living/breathing feel.

## Step 4: Fix Chat Button → WhatsApp Deep Link

**File**: `src/pages/EventosFeed.tsx`

- Currently the Chat button opens `EventGroupChat` (mock group chat). Change it to:
  - If the event has `organizer_whatsapp` (need to add this field to EventItem interface and mock data), open WhatsApp deep link: `https://wa.me/{phone}?text=...`
  - If no WhatsApp, show a toast with the organizer's contact info or fallback to the group chat.
- Update EventItem interface to include `organizer_whatsapp?: string | null`.
- Add WhatsApp numbers to mock events.

## Step 5: Fix Middle-Tap → Open Event Detail Page

**File**: `src/pages/EventosFeed.tsx` (EventCard)

- Add an `onClick` on the card's center area (excluding the action buttons and CTA row) that navigates to `/explore/eventos/${event.id}` with `state: { eventData: event }`.
- This replaces the current "More Info" overlay behavior with actual navigation to the full detail page.

## Step 6: Ensure Get Tickets → WhatsApp or External Link

Already partially working via the "Get Tickets" button calling `onChat()`. Update it to specifically open the WhatsApp deep link with a ticket-inquiry message.

---

## Technical Details

**Files to modify:**
1. `src/pages/EventosFeed.tsx` — Auto-play timer, progress bars, WhatsApp integration, middle-tap navigation
2. `src/components/CategorySwipeStack.tsx` — Subtle breathing zoom on top card

**No database changes needed** — event data already supports `organizer_whatsapp` in the `events` table schema (visible in EventoDetail.tsx).

