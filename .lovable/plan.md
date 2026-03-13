
Goal: make white-matte and black-matte truly consistent across all pages (text, buttons, cards, overlays), including the dashboard/filter screens shown in your screenshots.

What I found (root causes)
1) Current override coverage is partial:
- `theme-overrides.css` handles many `text-white`/`bg-black` cases, but misses a lot of variant and palette patterns (e.g. `data-[state=active]:text-white`, `bg-zinc-*`, `bg-slate-*`, `bg-neutral-*`).
2) High-traffic screens still use hardcoded dark inline styles:
- `src/pages/Index.tsx` uses inline `background: '#050505'` in multiple loading/fallback states.
- `src/components/SwipessSwipeContainer.tsx` empty state still hardcodes `text-white` and dark surface assumptions.
- `src/components/QuickFilterDropdown.tsx` and some dropdown/backdrop surfaces still lean dark-first.
3) Many remaining hardcoded classes across app:
- 259+ `text-white/70` matches, multiple `data-[state=active]:text-white`, plus dark palette classes in shared UI.

Implementation plan
Phase 1 — Strengthen global theme overrides (fastest broad fix)
- Expand `src/styles/theme-overrides.css` to include:
  - Variant-safe text selectors (including state-based classes) for white mode.
  - Dark neutral palette remaps (`bg-zinc-*`, `bg-slate-*`, `bg-neutral-*`, matching border/text/ring where needed).
  - Inline dark style patterns not currently covered (`#050505`, dark rgba backgrounds, dark gradients).
- Keep accent/brand colors untouched (primary, success, warning, destructive, gradient CTAs).

Phase 2 — Fix the exact screens still failing
- `src/pages/Index.tsx`
  - Replace inline `#050505` fallback backgrounds with theme tokens (`bg-background`/`hsl(var(--background))`), so loading/error/recovery screens switch correctly.
- `src/components/SwipessSwipeContainer.tsx`
  - Convert empty state and skeleton text/surface classes from hardcoded white/dark assumptions to semantic theme tokens.
- `src/components/QuickFilterDropdown.tsx`
  - Ensure dropdown panel/backdrop/hover states are theme-aware in both modes (not dark-biased).

Phase 3 — Patch known state-variant misses
- `src/components/NotificationsDialog.tsx`
- `src/pages/NotificationsPage.tsx`
  - Replace `data-[state=active]:text-white` dependency with theme-safe active text strategy so active tabs remain readable in white mode.

Phase 4 — Guardrails to stop regressions
- Add a compact theme utility pattern (`isDark` + semantic class map) for components with complex conditional styling.
- Update core shared UI surfaces (inputs/cards/popovers) to prefer semantic tokens over hardcoded dark colors.

Verification checklist (required before done)
- Test in both themes on mobile viewport (393x676):
  1) Client dashboard empty/caught-up states
  2) Owner dashboard
  3) Client filters page
  4) Owner filters page
  5) Notifications page/dialog tabs
  6) Index loading/fallback states
- Pass criteria: no unreadable text, no dark-only cards in white mode, no washed-out controls in black mode, and button labels/icons remain legible in both themes.

Files to update
- `src/styles/theme-overrides.css`
- `src/pages/Index.tsx`
- `src/components/SwipessSwipeContainer.tsx`
- `src/components/QuickFilterDropdown.tsx`
- `src/components/NotificationsDialog.tsx`
- `src/pages/NotificationsPage.tsx`
- (if needed after pass) shared primitives in `src/components/ui/*` for any leftover hardcoded surfaces.
