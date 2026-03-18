

## Plan: Fix Owner Nav, Clean Owner Profile, Restore AI Button

### Issues Found

1. **Owner bottom nav** — exists with 5 items (Dashboard, Profile, Liked, Messages, Filters) and should be working. The nav bar may be hiding due to scroll direction detection. Need to verify it renders on owner routes.

2. **Owner profile page** (`OwnerProfileNew.tsx`) — contains client-side sections that don't belong:
   - `MyHubQuickFilters` (line 183) — "Discovery Categories" — **remove**
   - `MyHubActivityFeed` (line 191) — "Recent Activity" — **remove**
   - `ExploreFeatureLinks` is not imported but could be confused with Quick Filters

3. **AI Search button** — was removed from both TopBar and BottomNavigation. Currently the TopBar has an empty comment where it used to be (line 271). Need to restore it.

4. **Owner nav icons** — should match client icons more closely, with "Listings" as the only unique button.

---

### Changes

#### 1. `src/components/BottomNavigation.tsx` — Match client icons, add Listings

Update owner nav to mirror client nav but swap Filters for Listings:

| Position | Client | Owner (new) |
|----------|--------|-------------|
| 1 | Compass → Explore | Compass → Explore |
| 2 | User → Profile | User → Profile |
| 3 | Flame → Likes | Flame → Likes |
| 4 | MessageCircle → Messages | MessageCircle → Messages |
| 5 | Search → Filters | Building2 → Listings |

Owner nav uses `Compass` (same as client) for dashboard, and `Building2` for Listings pointing to `/owner/properties`.

#### 2. `src/components/TopBar.tsx` — Restore AI Search button

Add back the AI search button (Sparkles icon) in the right section of the TopBar, before the Zap button. Same glass styling as other buttons. Calls `onAISearchClick` prop.

#### 3. `src/pages/OwnerProfileNew.tsx` — Remove client-only sections

Remove these sections (keep everything else):
- **Line 181-184**: `MyHubQuickFilters` ("Discover Categories") — delete
- **Line 186-192**: `MyHubActivityFeed` ("Recent Activity") — delete
- Remove unused imports: `MyHubQuickFilters`, `MyHubActivityFeed`

**Sections that stay**: Profile header, stats grid, edit profile button, Your Likes / Who Liked You grid, Share & Earn, Language, Radio, Settings, Sign Out.

### Files (3)

| File | Change |
|------|--------|
| `src/components/BottomNavigation.tsx` | Update owner nav: Compass icon for dashboard, Building2 for Listings, match client order |
| `src/components/TopBar.tsx` | Restore AI Search button (Sparkles icon) in right section |
| `src/pages/OwnerProfileNew.tsx` | Remove MyHubQuickFilters and MyHubActivityFeed sections + imports |

