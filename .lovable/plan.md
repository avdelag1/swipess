

# Plan: Complete Filter-to-Backend Connections for Both Roles

## Current State

After auditing the full filter pipeline:

**Client side (mostly working):**
- ClientFilters.tsx saves categories + listing type to both Zustand store AND `client_filter_preferences` DB table
- SwipessSwipeContainer hydrates filters from DB on mount
- useSmartListingMatching applies category, listing type, and price filters at SQL level

**Owner side (broken — no DB persistence):**
- OwnerFilters.tsx saves gender + client type to Zustand store ONLY — lost on refresh
- No hydration from DB when the owner dashboard mounts
- The `owner_client_preferences` table exists with `selected_genders`, `min_budget`, `max_budget` columns, but OwnerFilters.tsx never reads or writes to it
- Filters DO flow through to useSmartClientMatching at runtime (gender/clientType filtering works in-memory), but they vanish on page reload

## Changes

### File 1: `src/pages/OwnerFilters.tsx`
- Import `useOwnerClientPreferences` hook
- On "Apply", persist `selected_genders` and client type intent to `owner_client_preferences` table (background save, same pattern as ClientFilters)
- On mount, hydrate local state from DB preferences if the Zustand store is at defaults

### File 2: `src/components/EnhancedOwnerDashboard.tsx`
- Add a hydration effect: on mount, fetch `owner_client_preferences` from DB and seed the filterStore with `clientGender` and `clientType` if the store is at default values
- This ensures owner filters survive page refresh

### File 3: `src/hooks/smartMatching/useSmartClientMatching.tsx`
- Fetch `owner_client_preferences` for the current owner user
- Use DB-stored `selected_genders` and `min_budget`/`max_budget` as fallbacks when no explicit UI filter is passed
- This connects the owner's saved preferences to the matching algorithm

## What This Fixes
- Owner filters persist across sessions (currently lost on refresh)
- Owner swipe deck uses saved preferences as fallback when no UI filter is active
- Both roles (client AND owner) now have the same persistence + hydration pattern
- The full pipeline works: Filter UI → Zustand store → DB save → DB hydration → Smart matching query

