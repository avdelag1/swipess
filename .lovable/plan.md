
# Premium UI Redesign — Filter Pages, Liked Pages & Global Button System

## What the User Wants

A full visual upgrade across:
1. **Client Filter page** (`/filters`) — replace the plain flat tiles with vibrant, 4K-feeling cards
2. **Owner Filter page** (`/owner/filters`) — same premium treatment
3. **Client Liked Properties page** — cards, layout, action buttons look cheap now
4. **Owner Liked Clients page** (`LikedClients.tsx`) — the most outdated, using plain `Card` components and generic button styling
5. **Global button system** — all non-swipe action buttons across all pages to match the tactile 3D-glass "shadow-depth" style of the swipe deck buttons — rounded pill/capsule shapes, glow on interaction, vibrant accent colors

**Design Reference (from uploaded images):**
- Clean dark backgrounds with full-bleed imagery cards
- Bold rounded pill buttons (not just rounded rectangles — true pill shapes)
- Strong typography hierarchy — large name, small metadata
- Category tabs as floating pills, not bordered boxes
- Action buttons that feel 3D: subtle inset shadow top + drop shadow bottom
- Vibrant color accents (pink-to-orange gradient — matching brand identity)
- Spacious breathing room between elements
- Cards with image-first dominance, text floating on a gradient overlay at bottom

## Scope & Constraints

**DO NOT touch:**
- Dashboard pages (user explicitly said skip dashboard)
- The swipe card buttons (Like/Dislike/Undo/Share/Message in `SwipeActionButtonBar.tsx`) — user said they are fine
- Swipe physics / routing logic
- Any backend logic

**DO redesign:**
- `src/pages/ClientFilters.tsx` — full page overhaul
- `src/pages/OwnerFilters.tsx` — full page overhaul
- `src/pages/ClientLikedProperties.tsx` — card layout + action buttons
- `src/components/LikedClients.tsx` — card layout + action buttons (currently uses plain Card + generic buttons)
- `src/components/ui/button.tsx` — elevate the default button to have tactile 3D shadow depth

## Design System Being Applied

### Button System (Global)
Current: flat gradient rectangles with `rounded-2xl`

New system — **Tactile Glass Pill** — same language as the swipe deck action buttons:
- `rounded-full` or `rounded-3xl` for primary actions
- `inset 0 1px 0 rgba(255,255,255,0.15)` top highlight
- `0 4px 14px rgba(0,0,0,0.35)` bottom drop shadow
- Vibrant gradient fill for primary: `from-[#ec4899] to-[#f97316]` (pink → orange, brand identity)
- Active/pressed: `inset 0 2px 4px rgba(0,0,0,0.3)` (pushes in)
- `active:scale-[0.96]` for tactile press feel
- Ghost/outline variants: glass-pill `bg-white/8`, `border border-white/12`, top highlight `inset 0 1px 0 rgba(255,255,255,0.1)`

### Filter Pages
Current: flat dark tiles with thin borders

New system — **4K Vibrant Filter Cards**:
- Category tiles: Large, image-icon backed, with **vibrant gradient backgrounds** per category (blue for Property, orange for Moto, green for Bicycle, purple for Services)
- Full-width tiles with icon on left, label + description on right
- Selected state: **full gradient fill** + white text + checkmark with glow
- Unselected state: dark glass `bg-white/5` with colored icon only
- Section headers: pill-shaped label chips (e.g. `● CATEGORIES`) not just plain text
- Bottom apply button: full-width gradient pill, bold, glowing shadow

### Filter Page Category Cards (Client side)
```
Property    → gradient bg: linear-gradient(135deg, #1e3a8a, #3b82f6) — blue deep
Motorcycle  → gradient bg: linear-gradient(135deg, #7c2d12, #f97316) — amber/orange
Bicycle     → linear-gradient(135deg, #064e3b, #10b981) — emerald
Services    → linear-gradient(135deg, #4c1d95, #a855f7) — purple
```
Each tile: 2-column grid, tall card (100px), icon top-left, category name, selection glow border.

### Liked Pages — Card Redesign

**ClientLikedProperties cards** (currently: plain rounded box with flat content):
- Image takes full card width, 56% of card height (cinematic ratio)
- Bottom of image: gradient overlay `from-transparent to-black/80`
- Property name + price float ON the image at bottom (like Airbnb)
- Metadata (beds/baths/sqft) in a glassmorphic pill row below image
- "Contact Owner" button: full-width, brand gradient pill with glow
- Category badge: top-left pill on image

**OwnerLikedClients cards** (currently: plain `Card` with blue/purple/gray buttons):
- Portrait-ratio image (3:4) — full card width
- Name + age float on image with bottom gradient
- 3 action buttons below image in a glassmorphic pill row:
  - View Profile (purple pill icon button)  
  - Message (brand gradient pill icon button)
  - More (glass icon button)
- Remove the generic `<Card>` wrapper — use custom styled div with `rounded-3xl overflow-hidden`

### Layout Rhythm
- Page padding: `px-4` with `py-6`
- Card grid: `grid-cols-1 sm:grid-cols-2` — no 3+ columns on mobile
- Card gap: `gap-4`
- Section spacing: `space-y-8` between filter sections
- Typography scale: title `text-2xl font-bold`, section header `text-xs uppercase tracking-widest text-white/40`, item label `text-sm font-semibold`

## Files to Change

### 1. `src/components/ui/button.tsx`
- Update `default` variant: add `inset` top-highlight + stronger drop shadow
- Update `outline` variant: glass-pill style
- Update `ghost` variant: subtle glass-pill
- Update `size`: `default` → `h-11 px-6`, `sm` → `h-9 px-4`, `lg` → `h-13 px-8`
- Add new `brand` variant: pink-to-orange gradient with glow shadow (for primary CTAs)

### 2. `src/pages/ClientFilters.tsx`
Full redesign:
- Category section: 2-col grid with **tall gradient cards** (not flat tiles) — ~130px height
- Each category card has: gradient background, centered icon (32px), label, description
- Selected: full gradient + white border glow + animated check
- Unselected: dark glass + dimmed icon
- Listing Type section: horizontal pill row instead of vertical list
- Bottom apply button: brand gradient full-width pill

### 3. `src/pages/OwnerFilters.tsx`
Full redesign:
- Gender section: horizontal 2-col pill grid (not a vertical list)
- Client Type section: scrollable horizontal chips row
- Better visual hierarchy with gradient section markers
- Bottom apply button: brand gradient full-width pill

### 4. `src/pages/ClientLikedProperties.tsx`
Card redesign:
- Remove the flat `bg-white/5 border` wrapper style
- New: `rounded-3xl overflow-hidden` with cinematic card
- Image: `h-52` full bleed with bottom gradient overlay
- Price + name float on image
- Metadata row below as glassmorphic chips
- "Contact Owner" button: brand gradient pill, full width, shadow
- Category filter tabs: floating pills (keep current style, just improve active state with brand gradient)

### 5. `src/components/LikedClients.tsx`
Card redesign (lines 650-820 area):
- Replace `<Card className="p-6">` wrapper with custom `rounded-3xl overflow-hidden` glass card
- Portrait image: `h-64` full bleed
- Name + age: floating text over bottom gradient of image
- Action button row: 3 glass-pill icon buttons (View, Message, More) in a row below image
- Search bar: glass-pill input with icon inside
- Category tabs: floating pills to match ClientLikedProperties style
- Header section: simplify to title + count badge
- Safety toggle: glass-pill button instead of generic Button variant

## Technical Notes
- All changes are purely visual/CSS — zero logic changes
- `LikedClients.tsx` has `@ts-nocheck` so TypeScript errors won't block compilation
- The button.tsx change will cascade to all pages except dashboard (which is fine — user said skip dashboard but this makes everything else consistent)
- All new color values align with the existing brand memory: `#ec4899` (pink) → `#f97316` (orange) gradient as primary accent
- Use `will-change-transform`, `transform-gpu` on interactive buttons to maintain 60fps
- Framer Motion `whileTap` stays the same — `scale(0.96)` on all buttons
- No new dependencies needed — framer-motion and tailwind already installed
