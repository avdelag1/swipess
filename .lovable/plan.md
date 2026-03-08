

# Fix Owner Nav Icons, Remove Tutorial, Fix White Theme

## 1. Upgrade Owner Navigation Icons

**File:** `src/components/BottomNavigation.tsx`

Current owner icons feel dated. Replace with modern, consistent icons:

| Tab | Current Icon | New Icon | Reason |
|-----|-------------|----------|--------|
| Dashboard | `LayoutGrid` | `Home` | Matches the client "home base" feel, modern |
| Profile | `Briefcase` (suitcase) | `User` | Same as client side — human avatar, not a briefcase |
| Liked Clients | `Users` | `Heart` | Consistent with "likes" concept across both roles |
| Listings | `List` | `Building2` | More visual, represents properties/listings better |
| Messages | `MessageCircle` | Keep | Already good |
| AI Search | `Sparkles` | Keep | Already good |
| Filters | `SlidersHorizontal` | `Filter` | Cleaner, more modern filter icon |

Update the `ownerNavItems` array (lines 98-105) with these new icon mappings. All icons are already imported at line 30.

## 2. Remove All Tutorial Buttons and Route

**Files to edit:**

- **`src/App.tsx`** (lines 121-122, 303-304): Remove the `TutorialSwipePage` lazy import and the `/tutorial` route.
- **`src/components/SwipessSwipeContainer.tsx`** (lines 1241-1251, 1366-1376): Remove both "Take Interactive Tutorial" button blocks in empty states.
- **`src/components/ClientSwipeContainer.tsx`** (lines 843-853, 932-942): Remove both "Take Interactive Tutorial" button blocks in empty states.

The `TutorialSwipePage.tsx` file and `data/tutorialCards.ts` can remain (dead code, no harm), but all references and navigation to `/tutorial` will be removed.

## 3. Fix White Theme Inconsistencies

**File:** `src/index.css` (lines 1598-1601)

The override `.white-matte .text-primary` forces `color: #000000 !important` — this breaks primary-colored text (buttons, links, active states) by turning them black instead of the theme's pink/red primary color.

**Fix:** Remove `.text-primary` from that override rule. The `text-primary` class should use `hsl(var(--primary))` from the theme variables, not be forced to black. Only `.text-foreground` and `.text-muted-foreground` should be forced dark in light mode.

Additionally, the `.white-matte .bg-secondary` override forces white, but secondary backgrounds should be the subtle gray (`--secondary: 0 0% 96%`). Remove `.bg-secondary` from the background override too — let the CSS variables handle it properly.

These overrides were a brute-force fix that ended up breaking the theme's own color system.

