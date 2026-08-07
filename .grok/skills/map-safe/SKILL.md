---
name: map-safe
description: >-
  Safe editing protocol for Global Passport Mapbox map (PassportMapModal,
  markers, double-tap zoom, long-press relocate, cinematic open). Use when
  working on the map, passport markers, radar circle, map gestures, or when
  the user runs /map-safe.
---

# Map-safe edit protocol

Read `CLAUDE.md` and the map section of `AGENTS.md` before changing code.

## Hot files

- `src/components/PassportMapModal.tsx`
- `src/utils/mapDoubleTapZoom.ts` (`bindMapDoubleTapZoom`, `bindMapLongPress`)
- `src/utils/mapCinematicCamera.ts` (`cinematicOpenGlide`)
- `src/components/passport/passportMapMarkers.ts` (`applyMarkerStyle`, marker updates)

## Invariants (must preserve)

1. **Double-tap zoom** — `pointerup` on Mapbox **canvas**, capture phase. Not container `touchend`, not Mapbox `dblclick`.
2. **Long-press relocate** — canvas listeners, **capture phase** (`{ capture: true }`). Bubble phase races double-tap `stopPropagation` and wrongly relocates radar ~1s later.
3. **Cinematic open** — `cinematicOpenGlide` once per open session only (`framedOpenSessionRef`). Never dual-call in same cycle.
4. **Markers** — style via `applyMarkerStyle`; **never** `el.style.cssText =` (kills Mapbox `transform` → pins flash top-left).
5. **Fade-in** — new markers opacity `0` → `requestAnimationFrame` → `1`.
6. **No fighting cameras** — avoid duplicate `jumpTo` / `easeTo` / `flyTo` / `fitBounds` effects in one render cycle.

## Workflow

1. State the invariant you might touch.
2. Make the smallest change that achieves the goal.
3. Prefer extending utils over inlining new gesture systems in the modal.
4. If gestures change: call out that **device testing on a real phone** is required (iOS especially).
5. In the commit message, mention map safety if relevant (`fix(map):` / `fix(passport):`).

## Red flags — stop and re-read CLAUDE.md if you are about to

- Move listeners from canvas → container
- Switch capture → bubble
- Assign `cssText` on marker elements
- Add a second `cinematicOpenGlide` call
- Replace custom double-tap with Mapbox `dblclick` only
