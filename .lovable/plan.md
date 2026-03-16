

## Plan: Fix Owner Card Text, Nav Layout, Header Consistency

### 1. Owner Swipe Card — Name Text Invisible in Light Mode
**`src/components/SimpleOwnerSwipeCard.tsx`**

The content overlay at line ~648 has no gradient behind it — white text (`text-white`) is invisible against light images. Add a bottom gradient overlay (`transparent → rgba(0,0,0,0.6)`) spanning the lower portion of the card, matching the memory for swipe card readability. Also add `textShadow` to the name heading for extra contrast.

### 2. Bottom Nav — Reduce to 5 Items, Single-Line Labels
**`src/components/BottomNavigation.tsx`**

**Owner nav** currently has 7 items (Dashboard, Profile, Liked Clients, Listings, Messages, AI Search, Filters). Reduce to 5:
- `Home` → Dashboard (replace `LayoutGrid`)
- `User` → Profile (replace `Briefcase`)  
- `Flame` → Liked (replace `Users`, shorten "Liked Clients" → "Liked")
- `MessageCircle` → Messages
- `Filter` → Filters

Remove `Listings` and `AI Search` from owner nav.

**Client nav** has 6 items. Reduce to 5:
- Remove `AI Search` (accessible from TopBar)

Also increase inner padding from `py-1.5` to `py-2.5` to give the bar slightly more height for comfortable tap targets.

### 3. Header Buttons — Consistent Color Styling
**`src/components/ThemeToggle.tsx`**

The ThemeToggle uses different glass variables than the TopBar buttons (Zap/Bell). In light mode, TopBar uses `rgba(255,255,255,0.95)` bg while ThemeToggle uses `rgba(0,0,0,0.04)`. Unify ThemeToggle to use the same `glassBg`/`glassBorder`/`floatingShadow` values as TopBar buttons so all header buttons match.

### 4. Avatar — Bigger & Better Positioned
**`src/components/TopBar.tsx`**

The avatar is `h-9 w-9` (same as buttons) but user wants it slightly larger to stand out as a profile element. Increase to `h-10 w-10` and add `ml-1` to pull it away from the screen edge. Keep `rounded-xl` for consistency.

### Files to Edit (4)

| File | Change |
|------|--------|
| `SimpleOwnerSwipeCard.tsx` | Add bottom gradient overlay + text shadow for name readability |
| `BottomNavigation.tsx` | Reduce to 5 items per role, update icons, shorten labels, increase bar height |
| `ThemeToggle.tsx` | Unify glass styling with TopBar buttons |
| `TopBar.tsx` | Enlarge avatar to h-10 w-10, adjust left spacing |

