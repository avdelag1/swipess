

# Plan: Fix Frontend-Backend Connections

## Problem Summary

After auditing the core data flows, several critical disconnections exist between the frontend and backend that prevent the app from working end-to-end.

## Issues Found

### 1. Filter Preferences Schema Mismatch (CRITICAL)
The `client_filter_preferences` database table only has 7 columns: `preferred_categories`, `preferred_listing_types`, `preferred_locations`, `price_min`, `price_max`. But the `useClientFilterPreferences` hook defines ~80 fields (min_bedrooms, moto_types, bicycle_types, yacht_types, vehicle_types, etc.) that **do not exist in the database**. Any attempt to save detailed filter preferences silently fails.

**Fix:** Run a database migration to add the missing columns to `client_filter_preferences` so filter data actually persists.

### 2. Client Filters Page Doesn't Persist to Database (CRITICAL)
The `ClientFilters.tsx` page saves selected categories and listing type only to the Zustand `filterStore` (in-memory). When the user closes the app or refreshes, all filter selections are lost. The page never calls `useClientFilterPreferences` to persist to the database.

**Fix:** Update `ClientFilters.tsx` to save the selected categories and listing type to the `client_filter_preferences` table when the user applies filters. On mount, hydrate the Zustand store from the DB if stored preferences exist.

### 3. Filter Store Not Hydrated from Database on Login
When a user logs in, the `filterStore` starts empty. Even though `client_filter_preferences` has `preferred_listing_types`, this data is never loaded into the Zustand store that drives the swipe deck filtering.

**Fix:** Add a hydration step — when the swipe deck mounts, read `client_filter_preferences` from DB and seed the Zustand store with `preferred_categories` and `preferred_listing_types`.

### 4. Smart Matching Ignores Most Filter Fields
`useSmartListingMatching` reads `client_filter_preferences` from the DB but only uses a few fields for match scoring. The detailed filter fields (bedrooms, bathrooms, price range, amenities, pet-friendly, furnished) from the filter store need to be passed through and applied as SQL-level query constraints.

**Fix:** Ensure the smart matching hook applies `price_min`/`price_max` from the DB preferences when no explicit filter override is provided, and connect the `preferred_categories` DB field to the category filter logic.

## Changes

### Database Migration
Add missing columns to `client_filter_preferences`:
- `min_bedrooms`, `max_bedrooms`, `min_bathrooms`, `max_bathrooms` (integer)
- `pet_friendly_required`, `furnished_required` (boolean)
- `amenities_required`, `property_types`, `location_zones` (jsonb)
- `interested_in_properties`, `interested_in_motorcycles`, `interested_in_bicycles` (boolean)
- `moto_types`, `moto_price_min`, `moto_price_max`, `moto_year_min`, `moto_year_max` (core moto fields)
- `bicycle_types`, `bicycle_price_min`, `bicycle_price_max` (core bicycle fields)
- `vehicle_types`, `vehicle_price_min`, `vehicle_price_max` (core vehicle fields)

### File 1: `src/pages/ClientFilters.tsx`
- Import `useSaveClientFilterPreferences` hook
- On "Apply", save `preferred_categories` and `preferred_listing_types` to DB alongside the Zustand store update
- On mount, read from DB to hydrate initial selection state

### File 2: `src/hooks/useClientFilterPreferences.ts`
- Trim the TypeScript type to match actual DB columns (after migration adds the essential ones)
- Keep only fields that exist in the database

### File 3: `src/components/SwipessSwipeContainer.tsx`
- Add a hydration effect: on mount, fetch `client_filter_preferences` from DB and seed the filter store with `preferred_categories` and `preferred_listing_types` if the store is empty

### File 4: `src/hooks/smartMatching/useSmartListingMatching.tsx`
- When no explicit price filter is passed, fall back to `price_min`/`price_max` from the DB preferences
- Use `preferred_categories` from DB to apply category filtering when no UI filter override exists

## What This Fixes
- Filter preferences will actually save to the database and persist across sessions
- Users who set filters will see them restored when they return
- Smart matching will use saved preferences for better match scoring
- The full filter → swipe deck pipeline will be connected end-to-end

