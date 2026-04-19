

## Fix Build Error Blocking Map on Production

### Root Cause

The published site (and any non-Lovable browser) shows a broken/blank state because the bundle won't compile. `src/components/swipe/PokerCategoryCard.tsx` has a **duplicate `style={{` block** at lines 119–125 — a leftover from the previous edit that wasn't cleanly merged. This produces 27 TypeScript syntax errors and prevents the entire app from building, so the deployed version is stuck on an old bundle (or fails entirely on a fresh load), which is why you only see the map "working" inside Lovable's HMR preview where partial state is held in memory.

### The Bug

```tsx
style={{
  position: 'absolute',
  top: 0, left: 0,
  width: '100%', height: '100%',
  style={{                  // ← DUPLICATE OPENING — syntax error
  position: 'absolute',
  ...
} as any}
```

### The Fix (single file, single edit)

Merge the two `style` blocks into one valid object in `src/components/swipe/PokerCategoryCard.tsx` (lines 119–139):

```tsx
style={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  x: isTop ? x : 0,
  rotateZ: isTop ? dragTilt : 0,
  scale: isTop ? exitScaleValue : stackScale,
  opacity: isTop ? exitOpacityValue : stackOpacity,
  filter: stackedFilter,
  cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
  touchAction: 'none',
  willChange: 'transform, opacity',
} as any}
```

### Why this fixes the "map only works in Lovable" problem

- Once the file compiles, Vite produces a clean production bundle.
- When you click **Publish → Update**, the new bundle deploys to `swipess.lovable.app` and the map renders everywhere (Safari, Chrome, mobile, etc.).
- For users on the old cached version, a hard refresh (or the existing service worker auto-update logic in `main.tsx`) will pull the new bundle.

### Verification After Fix

1. Confirm the build error list is empty (no more `PokerCategoryCard.tsx` errors).
2. Reload `/client/dashboard` — poker stack should render, tap a card → map opens.
3. Click **Publish → Update** so the production site picks up the fix.
4. Open `https://swipess.lovable.app` in a fresh incognito window on another browser to confirm the map renders.

### Files Modified
- `src/components/swipe/PokerCategoryCard.tsx` — collapse duplicate `style={{` block into one

