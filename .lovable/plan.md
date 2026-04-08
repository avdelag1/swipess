

## Plan: Center Swipe Cards, Remove Bottom Line, Slim Icons App-Wide, Fix Scroll, Optimize Responsiveness

### 1. Center the Category Swipe Stack and Remove Bottom Line

**`src/components/CategorySwipeStack.tsx`**
- Line 139: The container uses `h-[min(42dvh,340px)]` — this may be too tall, pushing cards up against the header. Reduce to `h-[min(38dvh,320px)]` and ensure `items-center justify-center` keeps cards vertically centered.
- Line 425: Remove the "Bottom Glass Indicator" div (`h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent`) — this is the visible line at the bottom of the cards.
- Line 177: The instruction text at `-bottom-6` also creates a visual line effect. Move it further down or make it more subtle.

**`src/components/MyHubQuickFilters.tsx`**
- Line 24: Change container from `mb-2 px-4` with `pt-2` to use proper centering — `flex items-center justify-center h-full`.

### 2. Slim Icons App-Wide (12 files)

Reduce all remaining thick `strokeWidth` values to the new standard: **1.5 general, 1.8 active, 2 max for small decorative**.

| File | Current | New |
|------|---------|-----|
| `SwipeActionButtonBar.tsx` | 2.4–2.8 | 1.8 (large), 1.5 (small) |
| `QuickFilterDropdown.tsx` | 4 everywhere | 2 |
| `CategorySwipeStack.tsx` | 2.5 (icon), 4 (check) | 1.5, 2.5 |
| `PWAInstallPrompt.tsx` | 3 (X close) | 1.5 |
| `DiscoverySidebar.tsx` | 2.2 | 1.5 |
| `SignupErrorBoundary.tsx` | 2.5 | 1.8 |
| `ExploreFeatureLinks.tsx` | 2.5 | 1.5 |
| `SwipessSwipeContainer.tsx` | 2.5 | 1.5 |
| `ClientSwipeContainer.tsx` | 2.5 | 1.5 |
| `TinderTopNav.tsx` | 2.5 | 1.5 |
| `OwnerContracts.tsx` | 2.5 | 1.5 |

### 3. Fix Liked Pages Scroll

**`src/components/DashboardLayout.tsx`** (line 491-496)
- For liked/interested routes, change from `overflow-y-auto` to `overflow-hidden` so scroll ownership is fully delegated to the child page container. The child pages (`LikedClients.tsx` line 191, `ClientLikedProperties.tsx` line 193) already have `overflow-y-auto touch-pan-y` and proper overscroll behavior.

### 4. Performance / Instant Responsiveness

- Add CSS `:active` transforms on all interactive elements app-wide via `src/index.css` — a global `.interactive:active, button:active` rule with `transform: scale(0.97)` and `transition: transform 40ms` for instant press feedback matching the navigation bar.
- Remove any remaining `framer-motion` `whileTap` delays that add latency vs native CSS active states on frequently tapped elements.

