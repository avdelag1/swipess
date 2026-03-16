

## Plan: Smart Scroll Nav with Edge Fade Indicators

### Problem
1. Tapping any icon immediately navigates — no way to drag/scroll the bar by touching on icons
2. No visual hint that more buttons exist off-screen (left or right)
3. Client nav is not scrollable (only owner is)

### Changes

#### `src/components/BottomNavigation.tsx`

**1. Make both navs scrollable**
- Change `isScrollable` logic: always `true` (both client 5-item and owner 7-item bars scroll)
- Or better: enable scrollable for both by removing the `navItems.length > 5` check and always applying scroll styles + `flexShrink: 0` with `minWidth: 64`

**2. Smart touch: distinguish tap vs drag**
- Current: `onPointerDown` fires navigation immediately — this prevents scrolling by dragging over icons
- Fix: Replace `onPointerDown` with a tap detection system:
  - On `onPointerDown`: record start position + timestamp, do NOT navigate yet
  - On `onPointerUp`: if elapsed time < 200ms AND pointer moved < 8px → treat as tap → navigate
  - If pointer moves > 8px horizontally → it's a scroll drag → do nothing, let native scroll handle it
- This lets users drag across icons to scroll, while quick taps still navigate

**3. Edge fade indicators**
- Add two absolutely-positioned gradient overlays inside the glass bar container (left and right edges)
- Track scroll position with `onScroll` on the scroll container
- `canScrollLeft`: `scrollLeft > 4` → show left fade
- `canScrollRight`: `scrollLeft + clientWidth < scrollWidth - 4` → show right fade
- Left fade: `linear-gradient(to right, barBg 0%, transparent 100%)` — ~20px wide
- Right fade: `linear-gradient(to left, barBg 0%, transparent 100%)` — ~20px wide
- Both use `pointer-events: none` so they don't block touches
- Smooth opacity transition (200ms) when appearing/disappearing

### Implementation Detail

**Tap vs scroll detection** (replaces current `onPointerDown` handler):
```
// Track in ref: { x, y, time, item }
onPointerDown → store position + time + item
onPointerMove → if moved > 8px, mark as dragging
onPointerUp → if !dragging && time < 200ms → navigate(item)
```

This keeps the instant-feel for taps while allowing drag-to-scroll over icons.

**Edge fades** — two `<div>` overlays positioned `absolute left-0` and `absolute right-0` inside the glass bar, z-index above items, `pointer-events: none`, opacity driven by scroll state.

### Files (1)

| File | Change |
|------|--------|
| `src/components/BottomNavigation.tsx` | Enable scroll for both roles, add tap-vs-drag detection, add left/right edge fade indicators |

