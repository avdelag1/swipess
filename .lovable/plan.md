

# Layout & Responsiveness Fixes — Client + Owner Dashboards

## Problems Identified

1. **Card info overlay hidden behind action buttons**: `SimpleSwipeCard` positions content at `bottom-44` (176px) and `SimpleOwnerSwipeCard` at `bottom-44` too, but action buttons sit at `bottom-28` (112px). On shorter screens (< 700px height), the info text is obscured by the like/dislike buttons.

2. **No height-aware spacing**: All positioning uses fixed Tailwind classes regardless of device viewport height. A 5.4" iPhone SE (667px) vs a 6.7" iPhone Pro Max (932px) get identical layout — causing cramped or overlapping elements on smaller devices.

3. **Bottom navigation cramped**: Client has 6 nav items, Owner has 7. On narrow screens (< 375px), items compress and labels become illegible.

4. **SwipessSwipeContainer uses `minHeight: 100dvh`** without subtracting header/footer, so the card area extends behind both bars.

5. **No responsive font scaling**: Card info text sizes are fixed (`text-2xl`, `text-base`) regardless of screen width.

## Solution: Dynamic viewport-aware positioning

### File 1: `src/components/SimpleSwipeCard.tsx`
- Change the content overlay from `bottom-44` to a **CSS calc value** that responds to viewport height: `bottom: max(176px, calc(28vh))` — ensures info stays above the action button zone
- Add a subtle bottom gradient on the card image (stronger, taller) so text remains readable regardless of position
- Use responsive text sizes: `text-xl sm:text-2xl` for price, `text-sm sm:text-base` for metadata

### File 2: `src/components/SimpleOwnerSwipeCard.tsx`
- Same `bottom` positioning fix as SimpleSwipeCard — use calc-based value instead of `bottom-44`
- Same responsive text scaling

### File 3: `src/components/SwipessSwipeContainer.tsx`
- Change card area from `minHeight: 100dvh` to `height: 100%` since DashboardLayout already handles safe-area padding
- Change action button position from `bottom-28` to a dynamic value: `bottom: max(112px, calc(16vh))` — scales with screen height
- This creates proportional spacing: on tall phones, buttons float higher; on short phones, they stay reachable but don't overlap card info

### File 4: `src/components/ClientSwipeContainer.tsx`
- Same action button position fix as SwipessSwipeContainer — dynamic `bottom` value

### File 5: `src/components/BottomNavigation.tsx`
- Reduce items on narrow screens: hide the label text below 360px width (icon-only mode)
- Use `min-w-0 flex-1` for nav items instead of fixed widths so they distribute evenly
- Reduce icon size from 22px to 20px on `xs` breakpoints
- Add `overflow-hidden` to prevent items from overflowing the bar

### File 6: `src/components/SwipeActionButtonBar.tsx`
- Scale button sizes based on viewport: use CSS `clamp()` for LARGE (56-64px) and SMALL (40-48px) dimensions
- Scale gap from 8-10px using `clamp()`
- This ensures buttons don't overflow on narrow screens (< 360px)

### File 7: `src/components/DashboardLayout.tsx`
- Already uses `ResponsiveContext` for topBarHeight/bottomNavHeight — no changes needed, layout logic is correct

## Key Principle
Replace all fixed `bottom-XX` Tailwind classes with inline `style={{ bottom: 'clamp(Xpx, Yvh, Zpx)' }}` values. This makes the layout fluid across all device heights (SE → Pro Max → tablets → desktop) without breakpoint jumps.

## No DB Changes Required

