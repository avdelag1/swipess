

## Plan: Horizontally Scrollable Bottom Nav with 7 Owner Buttons

### What Changes

#### `src/components/BottomNavigation.tsx`

**1. Expand owner nav to 7 items:**

| # | Icon | Label | Target |
|---|------|-------|--------|
| 1 | `Compass` | Explore | `/owner/dashboard` |
| 2 | `User` | Profile | `/owner/profile` |
| 3 | `Flame` | Likes | `/owner/liked` |
| 4 | `Sparkles` | AI | `onAISearchClick` |
| 5 | `MessageCircle` | Messages | `/messages` |
| 6 | `Building2` | Listings | `/owner/properties` |
| 7 | `Search` | Filters | `/owner/filters` |

**2. Make the nav items row horizontally scrollable:**

- Change the flex container from `justify-between` to a scrollable row with `overflow-x: auto`, `scrollbar-width: none`, `-webkit-overflow-scrolling: touch`
- Each button gets a fixed `min-width` (~64px) so items don't shrink
- Add `data-no-swipe-nav` to prevent swipe-nav hook from hijacking horizontal scroll
- Hide the scrollbar with CSS (`-ms-overflow-style: none`, `::-webkit-scrollbar { display: none }`)
- On load, auto-scroll to center the active item

**3. Client nav stays at 5 items** — no scrolling needed, keeps current layout.

### Files (1)

| File | Change |
|------|--------|
| `src/components/BottomNavigation.tsx` | Add 7 owner nav items, make items container horizontally scrollable with hidden scrollbar |

