
# Public Share Preview — Full-Page Swipe Card Rebuild

When someone opens a shared link (`/listing/:id` or `/profile/:id`), the page currently has awkward floating header buttons, a clipped title, and a barely-visible "Sign In" button (per the screenshot). It needs to feel like the in-app swipe deck so first-time visitors instantly understand what Swipess is.

## Goals
1. Full-bleed cinematic page — no detached top bar with floating buttons, no white gap at top.
2. Visual matches the in-app swipe card (same hero photo treatment, same gradient overlay, same typography).
3. Two crystal-clear CTAs for guests: **Create Account** and **Sign In** — both fully visible with strong contrast.
4. After auth, return user to the exact listing/profile they opened (already partially wired via `?returnTo=`).
5. Rich link previews (OG image) pulled from the listing's first photo so when shared on WhatsApp / iMessage / social the actual listing photo shows up.

## Changes

### 1. `src/pages/PublicListingPreview.tsx` — full rewrite of the layout
- Remove the floating top bar with three separate buttons (Back / Live Listing pill / Share+Save). Replace with one slim minimal top row: just a small back chevron (top-left) and a small share icon (top-right), ghost style, no boxed backgrounds.
- Drop the standalone "LIVE LISTING" pill (it's noise).
- Wrap the photo + info in a single swipe-card frame matching `SwipeCardPeek` styling: rounded-[36px], full-bleed image, gradient overlay from bottom, title + price + stats stacked at the bottom of the card itself (not a separate sheet).
- Title: clamp to 2 lines, never overflow horizontally (`break-words`, `line-clamp-2`).
- Below the card, two equally-weighted full-width buttons stacked:
  - Primary: **Create Account** — solid white bg, black text, `h-14`, bold.
  - Secondary: **Sign In** — solid `bg-white/10` with `border-white/20`, white text (currently it's pale gray on light gray = invisible).
- If logged-in: single primary "Message Owner" button instead.
- Keep image carousel tap zones but on the card itself.

### 2. `src/pages/PublicProfilePreview.tsx` — same treatment
- Same layout: hero swipe-card with name/age/city overlay at bottom of card, two clear CTAs below.
- Remove the inline "Sign In" pill in the top bar (duplicates the bottom CTA).
- Lock teaser stays but compacted into the card footer.

### 3. Shared `PreviewSwipeCard` component (new)
- Path: `src/components/preview/PreviewSwipeCard.tsx`
- Renders a single read-only swipe-style card given `{ images, title, subtitle, price, stats, badges, footer }`.
- Used by both pages above to guarantee identical visuals to the in-app deck.

### 4. OG / link preview image
- `SEO` component already accepts an `image` prop and both pages pass `images[0]`. Verify `index.html` doesn't override og:image with a static one (check `<meta property="og:image">` defaults).
- Ensure `og:image:width` / `og:image:height` and `twitter:card="summary_large_image"` are set in `SEO` so WhatsApp/iMessage render a large preview tile.
- No backend change needed — Supabase image URLs are public.

### 5. Welcome / onboarding from a shared link
- When a guest lands via shared link, `?returnTo=/listing/:id` is captured. Currently the bottom buttons send them to `/` which shows the auth/welcome screen. Verify `Index.tsx` reads `returnTo` and routes back to the listing after sign-in. If it doesn't, add it (one small change in `Index.tsx`).

## Out of scope
- No changes to the in-app dashboard or swipe deck.
- No backend/RLS changes (listings table is already publicly readable for `is_active=true`).

## Files touched
- edit `src/pages/PublicListingPreview.tsx`
- edit `src/pages/PublicProfilePreview.tsx`
- create `src/components/preview/PreviewSwipeCard.tsx`
- edit `src/components/SEO.tsx` (add `og:image:width/height`, twitter large card if missing)
- edit `src/pages/Index.tsx` only if `returnTo` post-auth redirect isn't already wired
