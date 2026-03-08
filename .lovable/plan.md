

# Deep Audit: Remaining Bugs in Listings, Cards & Filter Connections

## Bug 1 — CRITICAL: Worker swipe cards show wrong data fields

**SimpleSwipeCard.tsx lines 569-572** renders worker cards using:
- `(listing as any).hourly_rate` — **does not exist** in DB. The DB has `price` + `pricing_unit`
- `(listing as any).service_type` — **does not exist** in DB. The DB has `service_category`
- `(listing as any).provider_name` — **does not exist** in DB

**Result:** Every worker swipe card shows no price and falls back to the listing title as "service name". The actual `service_category`, `pricing_unit`, and `price` fields are fetched but never read.

**Fix in SimpleSwipeCard.tsx:**
```
hourlyRate={listing.price}  // Use actual price field
serviceName={(listing as any).service_category || listing.title || 'Service'}
name={listing.title}  // Title is the provider/service name
```

**Fix in CardInfoHierarchy.tsx ServiceCardInfo:**
- Accept `pricingUnit` prop instead of hardcoding `/hr`
- Display `$X/session`, `$X/day`, etc. based on `pricing_unit`

## Bug 2 — HIGH: `Listing` interface has phantom fields not in DB

`useListings.tsx` defines `service_type` and `hourly_rate` on the `Listing` interface, but these columns **do not exist** in the `listings` table. This creates false type safety — code compiles but the values are always `undefined`.

**Fix:** Remove `service_type` and `hourly_rate` from the `Listing` interface. They should be `service_category` and `price` (already present).

## Bug 3 — HIGH: PropertyInsightsDialog uses same phantom fields

`PropertyInsightsDialog.tsx` lines 364-376 reads `listing.service_type` and `listing.hourly_rate` — both always undefined.

**Fix:** Replace with `listing.service_category` and `listing.price` + `(listing as any).pricing_unit`.

## Bug 4 — MEDIUM: `client_filter_preferences` has no worker/service columns

The `client_filter_preferences` table has `interested_in_properties`, `interested_in_motorcycles`, `interested_in_bicycles`, `interested_in_vehicles` — but **no `interested_in_services`** column. Users who select "Services/Workers" as an interest category have nowhere to persist this preference.

**Fix:** Add a DB migration to add `interested_in_services boolean default false` to `client_filter_preferences`.

## Bug 5 — MEDIUM: `combinedFilters` drops worker-specific fields from `appliedFilters`

In `DashboardLayout.tsx` line 489-503, `combinedFilters` spreads `...base` (which contains worker fields from `handleApplyFilters`) but then explicitly sets `category`, `categories`, `listingType`, `showHireServices`, `clientGender`, `clientType`. The worker fields survive via the spread, but only if quick filters don't override. When quick filter selects "services", `categories: ['worker']` is set correctly, but `showHireServices` is redundant and could conflict. This is a minor inconsistency, not a blocker — no code change needed.

---

## Files to Modify

| File | Bug | Change |
|------|-----|--------|
| `src/components/SimpleSwipeCard.tsx` | 1 | Map `price`→`hourlyRate`, `service_category`→`serviceName`, `title`→`name`, pass `pricing_unit` |
| `src/components/ui/CardInfoHierarchy.tsx` | 1 | Add `pricingUnit` prop to `ServiceCardInfo`, display dynamic unit instead of hardcoded `/hr` |
| `src/hooks/useListings.tsx` | 2 | Remove phantom `service_type` and `hourly_rate` fields from `Listing` interface |
| `src/components/PropertyInsightsDialog.tsx` | 3 | Replace `service_type`→`service_category`, `hourly_rate`→`price` |
| DB Migration | 4 | `ALTER TABLE client_filter_preferences ADD COLUMN interested_in_services boolean DEFAULT false;` |

