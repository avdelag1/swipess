# Plan — Polish exhausted state, deck scroll lock, icon sizing, Concierge clarity

## 1. Exhausted "Adjust Radius" screen — respect light/dark theme

File: `src/components/swipe/SwipeExhaustedState.tsx`

Right now it forces a black-feel surface even when the app is in white (light) mode (the screenshot shows pitch black while the user is on the white filter). Fix by gating colors on `isLight`:

- Wrap the root in a theme-aware background:
  - light: `bg-white text-black`
  - dark: keep transparent over the dark deck
- Scanning label, "Adjust Radius" headline, "Move the slider…" hint, "Or try another" caption: switch to `text-black/70` etc. when `isLight`.
- "NO PROPERTIES FOUND NEARBY" and the "PROPERTY" italic accent: in light mode use `text-primary` on white (already primary, but drop the heavy drop-shadow that fights white).
- Filter (sliders) circular button: 40px → 36px, icon 14px, theme-aware fill.
- LOCAL / 100 KM+ rail labels and the location pin chip in `DistanceSlider`: ensure they read on white as well as black (audit `DistanceSlider` once and add light-mode variants for the same tokens).

## 2. Owner side — keep dashboard + radius screen non-scrollable

Files: `src/components/AppLayout.tsx`, `src/components/SwipessSwipeContainer.tsx` (owner), `src/components/swipe/OwnerAllDashboard.tsx`.

- Confirm `isFullScreen` returns true for `/owner/dashboard` and the owner discovery deck routes so AppLayout applies `overflow-hidden` (it already does for client). If any owner route is missing from that allowlist, add it.
- In the owner exhausted/empty wrapper, remove any `overflow-y-auto` and replace with `overflow-hidden` + `h-full` so the radius UI stays pinned, matching client behavior.

## 3. Floating action / close icons — smaller, clearer, theme-aware

Files: `src/components/swipe/SwipeDeckBackButton.tsx`, `src/components/TopBar.tsx` (share / report / close), `src/components/ConciergeChat.tsx` (X close, history, etc.).

- Back / Share / Report / Close buttons: reduce hit area from 44×44 to 38×38, icons from 32px → 22px (back) and 20px → 18px (share/report). Stroke 2.0.
- Color must follow theme:
  - When the surface behind is the photo (swipe deck): keep pure white `#FFFFFF` + soft drop-shadow.
  - When on a normal page (light theme): use `text-foreground` so the icon turns black on white, white on black automatically. Remove the hard-coded `#FFFFFF` override on `SwipeDeckBackButton` and instead branch on `isLight` (white over photo, black over white background pages).
- Apply the same sizing pass to the Concierge chat header buttons (X, history, new chat, languages, copy) so they line up at ~18px in 32px tap targets.

## 4. Concierge AI chat — clean, readable, brand-consistent

File: `src/components/ConciergeChat.tsx` (plus the markdown styles).

Current issues from the user: garish blue/red highlights inside messages, hard-to-read fonts, unclear send/enter icon, weird inline color blocks.

Changes:

- **Message bubbles**:
  - User bubble: `bg-primary text-primary-foreground` (rose), 16px radius, no gradient.
  - Assistant bubble: `bg-card text-foreground border border-border/50` in light, `bg-white/[0.04] text-white border-white/10` in dark — single token-driven style. Remove any hard-coded blue/red backgrounds.
- **Markdown styling** (`ReactMarkdown` wrapper): set explicit prose classes
  - `prose prose-sm max-w-none prose-p:my-1.5 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded`
  - In dark mode add `prose-invert`.
  - Override `code`, `blockquote`, `hr`, `li` to use semantic tokens only — kill any `text-blue-*` / `text-red-*` classes.
- **Highlights / chips inside messages** (the "weird blue + red" the user sees): these come from inline action chips (NAV/DRAFT/FILTER buttons). Restyle them as a unified pill:
  - `bg-primary/10 text-primary border border-primary/20` light & dark, rounded-full, 12px text, single icon at 14px.
- **Input bar**:
  - Larger, more legible textarea: 15px font, `text-foreground`, `placeholder:text-muted-foreground`.
  - Send button: replace ambiguous `CornerDownLeft` with `ArrowUp` in a 36px filled primary circle, white icon. Disabled state: `bg-muted text-muted-foreground`.
  - Mic button: 32px, theme-aware ghost.
- **Header**: thinner (52px), title 15px semibold, persona avatar 28px. Close `X` 18px in 32px circle. All icons use `text-foreground`/`text-muted-foreground`.
- **Background**: drop the forced black panel; use `bg-background` so the chat matches whatever theme is active. Keep the subtle top gradient only in dark mode.

## 5. Quick QA pass

- Toggle light ↔ dark on: dashboard, swipe deck, exhausted state, Concierge chat — every icon must remain visible and every text must hit AA contrast.
- Verify owner dashboard + owner exhausted state cannot scroll vertically.

## Files touched

- `src/components/swipe/SwipeExhaustedState.tsx`
- `src/components/swipe/DistanceSlider.tsx` (light-mode tokens only)
- `src/components/swipe/SwipeDeckBackButton.tsx`
- `src/components/TopBar.tsx` (share/report/close sizing + theme color)
- `src/components/SimpleSwipeCard.tsx` / `SimpleOwnerSwipeCard.tsx` (icon sizes only)
- `src/components/AppLayout.tsx` (ensure owner routes in `isFullScreen` list)
- `src/components/ConciergeChat.tsx` (bubbles, markdown, input, header)

No backend, schema, or routing changes.
