

## Fix Build Errors + Cheers Theme + Profile Solidity + Map Polish

### What's broken right now
1. **9 TypeScript build errors** are blocking the entire app from compiling — that's why nothing renders cleanly.
2. **Cheers theme** (the third "Ivana" theme) only restyles a few CSS variables; many hard-coded `bg-black`, `bg-[#0d0d0f]`, `border-white/10` classes ignore it, so the theme bleeds through inconsistently.
3. **Client/Owner Profile pages** use translucent `bg-[#0d0d0f]/95` cards over a transparent body — looks washed out and Apple reviewers will flag it.
4. **Discovery map** still works but has untyped category casts and unused imports causing build warnings.

### Plan

**1. Fix all 9 build errors so the app compiles.**

| File | Fix |
|---|---|
| `DiscoveryMapView.tsx:60` | Type-guard the fallback: `userLatitude && userLongitude ? [userLatitude, userLongitude] : tulumCenter` so TS sees both as `number`. |
| `DiscoveryMapView.tsx:144` | Move `lightTiles` / `darkTiles` constants to module scope (above the component) so both `useEffect`s can reference them, and actually swap the tile layer on style/theme change. |
| `ClientDashboard.tsx:87` | Update `SwipeAllDashboardProps.setCategories` signature to `(category: QuickFilterCategory) => void` (it only ever passes one) and adjust `handleSelect` accordingly. |
| `ClientProfile.tsx:181` & `OwnerProfile.tsx:136` | `triggerHaptic('selection')` → `triggerHaptic('light')` (selection isn't in the union). |
| `PublicListingPreview.tsx:86,93` | Normalize `listing.images` once at the top: `const images = Array.isArray(listing.images) ? (listing.images as string[]) : []` and use `images.length` everywhere. |
| `PublicListingPreview.tsx:177` | Remove the non-existent `invert` prop and pass `variant="white"` instead (the SwipessLogo already supports a white variant via filter). |

**2. Polish the "Cheers / Ivana" third theme so it covers everything.**

The cheers theme defines tokens but the app is full of hard-coded `bg-black`, `bg-[#0d0d0f]`, `text-white/70` that ignore it. To fix without rewriting every component:
- In `src/styles/matte-themes.css`, add `.cheers` overrides that map common hard-coded classes via CSS:
  ```css
  .cheers .bg-black { background-color: hsl(22 90% 6%) !important; }
  .cheers .bg-\[\#0d0d0f\] { background-color: hsl(22 80% 10%) !important; }
  .cheers .bg-\[\#0d0d0f\]\/95 { background-color: hsl(22 80% 10% / 0.95) !important; }
  .cheers .border-white\/10 { border-color: hsl(38 92% 52% / 0.18) !important; }
  ```
- Set the cheers status-bar / `body` background to `hsl(22 90% 6%)` so the page feels fully wrapped in the theme.
- Update `index.css` so `.cheers #root, .cheers body` use the cheers background instead of the dark mode override.

**3. Make Client + Owner Profile cards solid (not transparent).**

In `ClientProfile.tsx` and `OwnerProfile.tsx`, replace every `bg-[#0d0d0f]/95` and `backdrop-blur-3xl` translucent card with a solid token-driven background:
- Dark mode: `bg-[#0a0a0a]` (solid)
- Light mode: `bg-white` (solid)
- Cheers: `bg-[hsl(22_80%_10%)]` (solid, picked up by the CSS override above)
- Strengthen text contrast: `text-white/30` → `text-white/60` for secondary labels; primary headings stay `text-white`.
- Increase border opacity from `border-white/5` to `border-white/12` for crisp button edges.

**4. Discovery map small polish (not a rewrite).**

The map already works after build fixes. Just:
- Re-add the `tileLayer` swap in the existing sync `useEffect` (currently has a dangling `tileUrl` that never gets applied) — when `mapStyle` or theme changes, remove old tile layer and add new one.
- Strengthen the radar center marker: change inner dot from `bg-black border-white` to `bg-white border-[3px] border-[#EB4898]` with a stronger blue/pink ring (per memory: the user wants the blue radar indicator visible).

**5. Verify end-to-end.**

After build succeeds:
- Visit `/client/dashboard` → tap a poker card → confirm map opens with visible radar center, working KM presets, and back button on left.
- Switch theme to Cheers → confirm Profile page, Dashboard, and Discovery map all adopt the cheetah palette with no black bleed-through.
- Open Client Profile and Owner Profile → confirm cards are solid, all text readable.

### Files to modify
- `src/components/swipe/DiscoveryMapView.tsx` — fix tuple type, hoist tile constants, polish radar center, apply tile swap
- `src/components/swipe/SwipeAllDashboard.tsx` — fix `setCategories` signature
- `src/pages/ClientDashboard.tsx` — already correct after signature fix
- `src/pages/ClientProfile.tsx` — solidify card backgrounds, fix haptic
- `src/pages/OwnerProfile.tsx` — solidify card backgrounds, fix haptic
- `src/pages/PublicListingPreview.tsx` — normalize images array, fix logo prop
- `src/styles/matte-themes.css` — add cheers coverage overrides
- `src/index.css` — adjust `.cheers` body/root background

