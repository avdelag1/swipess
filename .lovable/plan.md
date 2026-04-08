

## Plan: Photo Swimming Effect, Fix Likes Scroll, New Logo Everywhere

### 1. Photo "Swimming/Breathing" Effect on Card Images

The current swipe cards already have a subtle `whileInView` scale breathing (1.0 → 1.012 → 1.0 over 9s). The user wants the **photo inside** to feel like it's "swimming" — a slow, organic drift effect on the image itself, not just the card container.

**Implementation**: Add a CSS `@keyframes` animation to `CardImage.tsx` that applies a slow `scale(1.05)` + `translate` drift to the loaded image. This creates a Ken Burns-style "swimming" motion:

```css
@keyframes photo-swim {
  0%   { transform: scale(1.04) translate(0%, 0%); }
  25%  { transform: scale(1.06) translate(0.5%, -0.3%); }
  50%  { transform: scale(1.04) translate(-0.3%, 0.5%); }
  75%  { transform: scale(1.06) translate(-0.5%, -0.2%); }
  100% { transform: scale(1.04) translate(0%, 0%); }
}
```

- Applied to the main `<img>` in `CardImage.tsx` when loaded, with `animation: photo-swim 12s ease-in-out infinite`
- Also apply to QuickFilterBar category card images (owner + client filter cards)
- The effect is purely CSS, zero JS overhead, GPU-composited via `will-change: transform`
- The existing card-level breathing (`whileInView` scale) will be **removed** from `SimpleSwipeCard.tsx` and `SimpleOwnerSwipeCard.tsx` since the image swim replaces it (avoids double-motion)

**Files**: `src/components/CardImage.tsx`, `src/index.css` (keyframes), `src/components/SimpleSwipeCard.tsx`, `src/components/SimpleOwnerSwipeCard.tsx`, `src/components/QuickFilterBar.tsx`

### 2. Fix Likes Page Scroll (Client + Owner)

The likes pages (`ClientLikedProperties.tsx`, `OwnerInterestedClients.tsx`) have `touch-pan-y` and `min-h-[101dvh]` but scrolling is blocked. The issue is that `DashboardLayout.tsx` applies `overflow-y-auto` on `#dashboard-scroll-container`, so the child pages should NOT have their own `min-h-[101dvh]` or conflicting overflow. The `101dvh` forces the content taller than the scroll container but the nested overflow contexts fight each other.

**Fix**:
- Remove `min-h-[101dvh]` from both `ClientLikedProperties.tsx` and `OwnerInterestedClients.tsx` — let them be natural-height children of the scroll container
- Ensure `touch-pan-y` is on the grid container holding the cards
- Remove `overflow-x-hidden` from these pages (parent already handles it)
- Add `overscroll-behavior: contain` to prevent scroll chaining issues

**Files**: `src/pages/ClientLikedProperties.tsx`, `src/pages/OwnerInterestedClients.tsx`

### 3. New Logo — Replace Everywhere

The uploaded image shows "SWIPESS" in bold white uppercase with a black outline/shadow effect on a black background. This is the new brand logo to replace the current text-based `SwipessLogo` component.

**Steps**:
1. Copy the uploaded image to `public/icons/swipess-brand-logo.png`
2. Generate favicon/app icon versions using a script (16, 32, 48, 96, 192, 512px)
3. Update `SwipessLogo.tsx` to render the image instead of CSS text — use `<img>` with size mapping
4. Update `index.html`:
   - Replace splash wordmark text with `<img src="/icons/swipess-brand-logo.png">`
   - Update favicon `<link>` tags to point to new generated icons
   - Update apple-touch-icon
5. Update `manifest.json` icon references
6. Delete old `favicon.ico` and `favicon.png` from `public/` root (replace with new ones)

The `SwipessLogo` component is used in 10+ places (TopBar, ConciergeChat, LandingPage, Settings, PremiumLoader, etc.) — changing the component automatically propagates everywhere.

**Files**: `src/components/SwipessLogo.tsx`, `index.html`, `public/manifest.json`, `public/icons/` (new files), `public/favicon.png`, `public/favicon.ico`

### Summary of All Files Modified

1. `src/components/CardImage.tsx` — Add swimming animation to loaded images
2. `src/index.css` — Add `@keyframes photo-swim`
3. `src/components/SimpleSwipeCard.tsx` — Remove card-level `whileInView` breathing (replaced by image swim)
4. `src/components/SimpleOwnerSwipeCard.tsx` — Same removal
5. `src/components/QuickFilterBar.tsx` — Add swim animation to filter card images
6. `src/pages/ClientLikedProperties.tsx` — Fix scroll: remove `min-h-[101dvh]`, clean overflow
7. `src/pages/OwnerInterestedClients.tsx` — Same scroll fix
8. `src/components/SwipessLogo.tsx` — Replace text with image-based logo
9. `index.html` — New favicon, splash image, apple-touch-icon
10. `public/manifest.json` — Updated icon paths

