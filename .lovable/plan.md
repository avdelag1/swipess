

## Plan: Remove Background Frames, Green Glows, and Fix Build Error

### Problem Analysis
1. **Top/bottom frame backgrounds**: The `DashboardLayout.tsx` main container has `bg-background` and padding for the header/footer areas. On native iOS (Xcode), this solid background color shows through as visible rectangular bands behind the transparent TopBar and BottomNavigation — creating the "frame" effect.

2. **Green glow dots on nav buttons**: Line 376-378 in `BottomNavigation.tsx` renders a pulsing emerald-green presence indicator dot on every nav button. On desktop it's hidden (`opacity-0 group-hover:opacity-100`), but on iOS touch devices, hover states can stick — making these dots visible.

3. **Build error**: `ConciergeChat.tsx` line 480 has a TypeScript type mismatch with `Uint8Array<ArrayBufferLike>` vs `Uint8Array<ArrayBuffer>`.

### Changes

**1. Remove background frames (src/components/DashboardLayout.tsx)**
- Change `bg-background` on the main scroll container (line 489/493) to `bg-transparent` for the dashboard routes, so no solid color bar appears behind the floating header/footer
- Alternatively, keep `bg-background` but make the padding regions transparent by setting the background only on the inner content wrapper (line 507), not on the padded main element

**2. Remove green glow dots (src/components/BottomNavigation.tsx)**
- Delete lines 376-379 — the entire "PRESENCE GLOW" div that renders the pulsing emerald dot on each nav button

**3. Fix build error (src/components/ConciergeChat.tsx)**
- Add explicit type cast on line 480: `new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>` or use a simpler approach with `dataArrayRef` typed as `Uint8Array<ArrayBuffer>`

**4. Remove active icon drop-shadow glow (src/components/BottomNavigation.tsx)**
- Line 406: Change the active icon `filter: 'drop-shadow(0 0 4px rgba(255,107,53,0.3))'` to `'none'` — this removes any orange glow effect on active nav icons that may appear as unwanted light effects on native iOS

### Files Modified
- `src/components/DashboardLayout.tsx` — transparent background on padding regions
- `src/components/BottomNavigation.tsx` — remove green dots and icon glow
- `src/components/ConciergeChat.tsx` — fix TypeScript build error

