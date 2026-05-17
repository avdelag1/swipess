# Plan: Fix Stuck Scrolling + Apple-Style Polish for Events & Roommates

Two clear problems, fixed surgically.

---

## 1. Why pages feel "stuck" (root cause)

`DashboardLayout` already has one authoritative scroll container (`<main id="dashboard-scroll-container">`) with `overflow-y-auto` and `touch-action: pan-y`. But several pages render **their own inner `h-[100dvh] overflow-y-auto` container** on top of it. Result: two scroll layers fight for the same touch, and on mobile the outer `pan-y` often "wins" and swallows the gesture, so the inner snap-feed never moves. This is exactly the symptom the user is describing.

Confirmed offenders:
- `src/pages/EventosFeed.tsx` line 424 — inner `h-[100dvh] overflow-y-auto snap-y snap-mandatory` while the route is **not** in `isFullScreenRoute` (so the outer `<main>` is also scrolling).
- `isFullScreenRoute` substring match in `DashboardLayout.tsx` (lines 187-197) excludes any path containing `"likes"`, `"interested"`, `"liked"`, etc. → `/explore/events/likes` and `/explore/roommates/likes` get the wrong mode.
- A handful of other pages (RoommateMatching overlay, etc.) layer `fixed inset-0 overflow-y-auto` over the same parent.

There's also a small layout bug in `PersistentDashboardLayout`: the inner `#swipess-dashboard-root` uses `flex-1` but its parent is a `block` wrapper (`min-h-full pt-... pb-...`), so `flex-1` does nothing and the absolutely-positioned persistent scene can collapse to 0 height during certain transitions — making the page momentarily feel frozen until the next paint.

### Fixes

**A. Make full-screen-feed routes truly full-screen.**

In `src/components/DashboardLayout.tsx`:
- Replace the substring-based `isFullScreenRoute` with an explicit allow-list:
  ```
  ['/explore/events', '/explore/events/', '/explore/roommates', '/explore/roommates/',
   '/radio', '/radio/world', '/client/dashboard/camera', '/owner/dashboard/camera', ...]
  ```
- Keep the existing radio/camera prefix checks but drop the noisy `scrollExclusions` heuristic (it currently turns full-screen OFF for any URL with the substring "likes"/"profile"/etc., which is the source of the `/explore/events/likes` bug).
- When `isFullScreenRoute`, `<main>` already does the right thing (`overflow-hidden touch-none`) — the inner page owns the scroll.

**B. Stop nesting scroll containers on scrollable pages.**

For pages that are *not* full-screen feeds (Profile, Settings, Liked, Filters, Contracts, Saved Searches, FAQ, Vault, etc.):
- Audit and remove any inner `h-[100dvh] / h-screen / overflow-y-auto / overflow-auto` on the **outermost** page wrapper. The dashboard `<main>` is the single scroll container; the page should be a normal `<div className="w-full">…</div>`.
- This is the canonical fix for "I can't scroll a single page omfg" because today double-scroll containers + `touch-action: pan-y` race each other on iOS/Android.

**C. Repair the flex chain in `PersistentDashboardLayout`.**

In `src/components/PersistentDashboardLayout.tsx`:
- Change the inner block wrapper from `block min-h-full pt-... pb-...` (inside `DashboardLayout`'s `main`) to keep `flex flex-col min-h-full` so `#swipess-dashboard-root`'s `flex-1` actually resolves and the persistent scene always has a defined height — eliminates the frozen-first-paint flash on route changes.

**D. Touch hygiene.**

- Add a single global rule in `src/index.css`: `:where(button, [role="button"], a, label) { touch-action: manipulation; }` — kills the iOS 300ms tap delay across the app.
- On the EventosFeed inner snap container, set `touch-action: pan-y` explicitly (it inherits `none` from the parent in full-screen mode and that's what makes snap-feel sluggish).

### Verification

- Open Profile / Settings / Filters / Liked / FAQ on client and owner → page scrolls smoothly from first touch with no double-bounce.
- Open `/explore/events` → vertical snap feed responds instantly to drag; back button still works; category pills still horizontal-scroll.
- Open `/explore/roommates` → full-screen swipe deck behaves; `/explore/roommates/likes` scrolls cleanly.
- Tap latency on every primary button feels native (no 250-300ms delay).

---

## 2. Apple-style design polish for Events & Roommates

Constraints from project memory: semantic tokens only (`bg-background`, `text-foreground`, `border-border`, `bg-card`), no emojis in UI labels, no Sonner toasts, keep existing structure/physics ("enhance, do not mutate").

### Events feed (`src/pages/EventosFeed.tsx`)

Visual direction — Apple Music / Apple TV+ feed:
- **Top HUD** — replace ad-hoc `rgba(0,0,0,0.45)` glass with a single token-driven recipe: `bg-background/55 backdrop-blur-2xl backdrop-saturate-150 border border-border/40`. Back button becomes a 36px hairline circle (`border-border/60`, no shadow), matching iOS chevrons.
- **Category pills** — Apple-style segmented look: 28px tall, `text-[11px] font-semibold tracking-tight` (drop the heavy `font-black uppercase tracking-[0.12em]`), active pill uses `bg-foreground text-background` with a subtle inner highlight, inactive uses `bg-foreground/[0.06] text-foreground/70`. Remove per-category gradients; keep the soft color glow behind only the active pill.
- **Snap card** — rounded `rounded-[28px]` corners, full-bleed image, bottom info block uses `bg-gradient-to-t from-black/80 via-black/30 to-transparent` with `pb-[calc(env(safe-area-inset-bottom)+96px)]` so text never collides with bottom nav.
- **Typography** — title `text-[28px] leading-[1.05] font-semibold tracking-[-0.02em]`, meta row `text-[13px] text-white/70`. No italic, no all-caps body copy.
- **Motion** — replace `transition-all duration-300 scale-105` on pills with `transition-[transform,background-color] duration-200 ease-out active:scale-95` (Apple's tap response). Snap container gets `scroll-snap-stop: always` + `scroll-snap-type: y mandatory` (already there) but momentum tuned: `overscroll-behavior-y: contain` so the feed doesn't bounce into the nav.

### Roommate matching (`src/pages/RoommateMatching.tsx`)

- Same surface tokens as above (no raw `bg-white/5`, switch to `bg-card/60 backdrop-blur-xl border-border/40`).
- Card frame: `rounded-[32px]`, hairline border, single `shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]` instead of stacked shadows.
- Header chip ("Roommate Match" label) — `text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/60` with a 6px dot in `bg-primary` (Rose token), Apple-style status indicator.
- Action buttons (pass/like) become 64px circles with hairline border + subtle glass fill (`bg-card/70 backdrop-blur-2xl border-border/50`), Rose-tinted icon for "like", neutral for "pass". `active:scale-[0.92]` for tactile feedback.
- Empty state: large rounded glass card centered, Apple-style copy ("No more matches nearby. Check back soon."), single primary CTA.

No business logic, swipe physics, routing, or data layer changes.

---

## Files touched

```text
src/components/DashboardLayout.tsx           explicit full-screen allow-list, drop substring exclusions
src/components/PersistentDashboardLayout.tsx repair flex chain on inner wrapper
src/index.css                                global touch-action: manipulation
src/pages/EventosFeed.tsx                    Apple HUD/pills/snap tuning, remove inner h-[100dvh] from non-full-screen branches if any, set touch-action: pan-y on snap container
src/pages/RoommateMatching.tsx               token-driven Apple-style surfaces, buttons, empty state
```

Plus an audit pass on these to remove redundant inner scroll containers if present:
```text
src/pages/ClientProfile.tsx
src/pages/OwnerProfile.tsx
src/pages/ClientSettings.tsx
src/pages/OwnerSettings.tsx
src/pages/ClientLikedProperties.tsx
src/pages/OwnerLikedClients.tsx
src/pages/OwnerInterestedClients.tsx
src/pages/ClientWhoLikedYou.tsx
src/pages/OwnerSavedSearches.tsx
src/pages/ClientSavedSearches.tsx
```
(Only remove the outermost wrapper's `h-screen / h-[100dvh] / overflow-y-auto`; leave inner scrollers like horizontal pill rows alone.)

## Out of scope

- Radio dropout fixes (different bug, separate plan when you want it)
- Any change to swipe physics, routing, auth, or data fetching
- Visual changes to other pages — only Events + Roommates this round
