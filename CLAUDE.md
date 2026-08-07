# Swipess – Claude Code Guidelines

This file is read automatically by Claude Code / Grok at the start of every session.
It documents critical behaviours that MUST NOT be broken by future edits.

**Full project rules (stack, commands, git, security, layout):** see `AGENTS.md`.
This file is the deep-dive for **map gesture safety** only.

---

## Map (PassportMapModal) — Protected Interactions

The map has several gesture handlers that took many iterations to get right.
**Do not remove, move, or refactor these without testing on a real phone.**

### 1. Double-tap zoom (`bindMapDoubleTapZoom`)

**File:** `src/components/PassportMapModal.tsx` — inside the `beginInit` IIFE  
**Utility:** `src/utils/mapDoubleTapZoom.ts` → `bindMapDoubleTapZoom`

Uses `pointerup` on the Mapbox **canvas** with `{ capture: true }`.  
This is intentional — `touchend` on the container is unreliable on iOS when
the canvas underneath has `touchAction: none`. Do **not** switch this back to a
`touchend` listener on the container or a Mapbox `dblclick` event.

The cleanup is stored in `unbindMapDoubleTapRef` and released on unmount.

### 2. Long-press relocate (`bindMapLongPress`)

**File:** `src/components/PassportMapModal.tsx` — same `beginInit` block  
**Utility:** `src/utils/mapDoubleTapZoom.ts` → `bindMapLongPress`

1-second hold on any empty map area moves the radar search circle to that
point via `relocateSearchRef.current(lng, lat)`. Bound on the canvas with
`pointerdown/pointermove/pointerup`. Do **not** move this to the container or
a React synthetic event — it must fire even under HUD overlays.

**Critical:** these listeners MUST be registered in **capture phase**
(`{ capture: true }`). The double-tap zoom binder shares the same canvas and
calls `stopPropagation()` on a detected double-tap. A bubble-phase long-press
listener would be suppressed by that, so the long-press timer started by the
second tap is never cleared — it fires ~1s later and wrongly relocates the
radar (which also wipes the listings, since the search center jumps to an
empty area). Capture-phase listeners on the same element still run after a
non-immediate `stopPropagation`. Do **not** switch these back to bubble phase.

### 3. Cinematic open animation (`cinematicOpenGlide`)

**File:** `src/components/PassportMapModal.tsx` — "First paint" `useEffect`  
**Utility:** `src/utils/mapCinematicCamera.ts` → `cinematicOpenGlide`

Fires **once per open session** (guarded by `framedOpenSessionRef`).  
It does three things in one pass: animate the camera, draw the radar circle,
and sync the pin markers. Do **not** add a second call to `cinematicOpenGlide`
anywhere else in the same component — two calls in the same render cycle will
interrupt each other and break all three.

### 4. Marker ghost fix (`applyMarkerStyle`)

**File:** `src/components/passport/passportMapMarkers.ts`

`updateListingMarkerEl` and `updateProfileMarkerEl` call `applyMarkerStyle`
instead of assigning `el.style.cssText` directly. This preserves the CSS
`transform` that Mapbox uses to position the pin. Overwriting `cssText` directly
resets the transform to `translate(0,0)` and makes all pins flash to the top-left
corner when the pin sheet closes. Do **not** revert this to direct `cssText`
assignment.

### 5. Marker fade-in

**File:** `src/components/PassportMapModal.tsx` — `upsertListing` / `upsertProfile`

New markers start at `opacity: 0` and fade to `opacity: 1` in the next
animation frame. This prevents the same top-left blink on first render.
Do **not** remove the `requestAnimationFrame(() => { el.style.opacity = '1'; })` call.

---

## General Rules

- **Push to `main`** — there is no separate feature branch.
- **TypeScript must be clean** before committing (`npx tsc --noEmit`).
- **Do not use `el.style.cssText =`** on Mapbox marker elements (see §4).
- **Do not add duplicate effects** that call the same Mapbox camera function
  (`jumpTo`, `easeTo`, `flyTo`, `fitBounds`) in the same render cycle.
