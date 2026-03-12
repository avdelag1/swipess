

# Integrate MyHub into Profile Pages + Full Navigation Audit

## What's Happening

The profile pages (`ClientProfileNew`, `OwnerProfileNew`) already have their own profile header (avatar, name, email, edit button). The MyHub components (`MyHubProfileHeader`, `MyHubQuickFilters`, `MyHubActivityFeed`) contain additional valuable content that should be merged in — but **without duplicating** the profile header/avatar that already exists.

## What to Add (Common Sense Merge)

### Unique value from MyHub to integrate into profile pages:

1. **Quick Stats Grid** (from `MyHubProfileHeader`) — Connections count, Activity level, Matches count. This is useful context that the current profile pages lack. Add it below the profile header as a 3-column stat grid.

2. **Quick Filters** (`MyHubQuickFilters`) — Category discovery buttons (Property, Moto, Bicycle, Services). Useful shortcut from the profile. Add below stats.

3. **Activity Feed** (`MyHubActivityFeed`) — Recent matches, messages, likes. Shows marketplace liveness. Add below filters with "Recent Activity" label.

### What NOT to add (already exists on profile):
- Profile avatar/name/email — already on both profile pages
- Profile completion bar — `ClientProfileNew` already has its own
- Edit button — already exists

## Files to Modify

### `src/pages/ClientProfileNew.tsx`
- Import `MyHubQuickFilters` and `MyHubActivityFeed`
- Add a **Quick Stats** section (3-col grid: Connections, Activity, Matches) after the profile header, using the same card styling as the existing profile page
- Add `<MyHubQuickFilters />` after the action grid (Likes / Who Liked You)
- Add `<MyHubActivityFeed />` with a "Recent Activity" section header after quick filters
- Keep everything else (bio, interests, share, radio, premium, settings, sign out)

### `src/pages/OwnerProfileNew.tsx`
- Same additions: Quick Stats grid, `<MyHubQuickFilters />`, `<MyHubActivityFeed />`
- Placed in the same logical position as client profile

### Navigation Audit — Verify All Routes Work

All routes are already correctly defined in `App.tsx` (lines 245-299). The `AnimatedOutlet` fix (using `<Outlet />` instead of `useOutlet()`) is already in place. The `BottomNavigation` correctly maps to all paths. No navigation fixes needed — the core issue was already resolved in the previous iteration.

**Buttons to verify are functional:**
- Client: Explore → `/client/dashboard`, Profile → `/client/profile`, Likes → `/client/liked-properties`, Messages → `/messages`, Filters → `/client/filters`
- Owner: Dashboard → `/owner/dashboard`, Profile → `/owner/profile`, Liked Clients → `/owner/liked-clients`, Listings → `/owner/properties`, Messages → `/messages`, Filters → `/owner/filters`
- Profile page buttons: Your Likes, Who Liked You, Radio, Premium, Settings, Sign Out — all have correct `navigate()` calls and matching routes

All navigation paths are correctly wired. No dead buttons or broken routes.

## Expected Result
- Profile pages become the **unified hub**: identity + stats + category filters + activity feed + actions
- No duplicate information (single avatar, single completion bar)
- All navigation continues to work across all tabs and sub-pages

