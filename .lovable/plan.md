# Full App Polish & Performance Audit

A focused pass to fix two real bugs surfaced in the console and elevate the "instant + buttery" feel across the app, without touching architecture, swipe physics, or routing.

## Bugs to fix (confirmed from console)

1. **Duplicate React keys in `SwipeActionButtonBar`** — AnimatePresence is warning about non-unique keys, which causes flicker and dropped exit animations on the floating action icons.
   - Make each motion child key uniquely derived (action id + card id), and ensure stable keys across re-renders.

2. **`column client_profiles.occupation does not exist`** — a query is selecting a removed column, throwing on every dashboard load.
   - Locate the offending `.select(...)` (likely in a profile/insights hook) and remove `occupation` or replace with the current field. Verify against the live schema before changing.

## Speed & "instant" feel

- **Tap latency**: audit `useInstantReactivity` to also fire on `:active` for elements without pointer events (Safari edge case), and ensure `touch-action: manipulation` on all primary buttons to kill the 300ms tap delay where still present.
- **Route transitions**: confirm `useAppNavigate` prefetch fires on `pointerdown` (intent), not `click`, on bottom nav and header buttons. Add prefetch to any nav buttons missing it (Insights modal, filter chips, profile tiles).
- **Suspense fallbacks**: replace any remaining blank `min-h-[60vh]` placeholders on hot routes (Dashboard, Filters, Liked) with a 1-frame skeleton matching final layout to avoid layout shift.

## Smoothness & micro-interactions

- **Swipe action bar**: add `will-change: transform, filter` only while pressed (remove after) to avoid permanent layer promotion; keep the new frameless drop-shadow look.
- **Card stack**: verify `RecyclingCardStack` slot rotation reattaches engine on the same frame as the DOM swap (already uses rAF — confirm no double rAF), preventing the brief unresponsive window after a fast swipe.
- **Scroll**: ensure `overscroll-behavior: contain` on scroll containers in Liked, Insights, and Filters to stop rubber-band leaking into the page.
- **Modals**: standardize open/close to 220ms ease-out / 180ms ease-in across `LikedListingInsightsModal`, `TokensModal`, and Concierge sheet for a unified rhythm.

## Visual hierarchy polish (no layout changes)

- **Header / nav icon contrast**: confirm the dark-icons-when-not-on-deck logic from `useDeckHasCards` covers the Filters page and Insights modal back-state (icons currently can read white over light backgrounds for a frame).
- **Typography rhythm**: bump primary titles on empty-state and Filters pages to the 28–32 / 14–16 power ratio defined in the design memory; tighten letter-spacing on uppercase CTAs to `0.22em`.
- **Shadow scaling**: align floating action shadow blurs to the 4 / 12 / 24 / 60 ladder so the swipe bar, FABs, and modals feel hierarchically layered instead of equal-weight.

## Out of scope

- No changes to swipe physics, routing, auth, or DB schema.
- No new components or pages.
- No copy/translation changes beyond fixing the Insights titles already shipped.

## Technical notes

- Files most likely touched: `src/components/SwipeActionButtonBar.tsx`, the hook selecting `client_profiles.*` (search `'occupation'` across `src/`), `src/hooks/useInstantReactivity.ts`, `src/components/AnimatedOutlet.tsx`, `src/hooks/useDeckHasCards.ts`, a few page-level CSS tweaks.
- Verification: reload Client Dashboard → no duplicate-key warning, no `42703` query error, swipe + nav feel instant, header icons remain legible across routes.
