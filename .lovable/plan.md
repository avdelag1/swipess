

## Plan: Fix All Build Errors

There are ~40+ TypeScript build errors across multiple files. Here's the fix plan grouped by file.

### 1. `src/pages/EventosFeed.tsx` (Most errors — ~25)

**Root causes:**
- `EventItem` interface missing `is_promo` field (used in mock data and `StoryCard`)
- `StoriesView` component (lines 819-1108) contains duplicate inline filter/liked sheet code (lines 927-1108) that references parent-scoped variables (`showFilters`, `isLight`, `freeOnly`, etc.). This code is already extracted into `FilterSheet` and `LikedSheet` components used by the parent. **Fix: delete lines 927-1108** (the duplicate inline sheets inside `StoriesView`)
- `StoryCard` uses `baseEventId` which is never declared. **Fix: add `const baseEventId = event.id;`**
- `event.is_promo` used but not on `EventItem`. **Fix: add `is_promo?: boolean` to `EventItem` interface**

### 2. `src/pages/EventoDetail.tsx` (3 errors)

- Line 39: `useNavigate` used but not imported (only `useAppNavigate` is imported). **Fix: import `useNavigate` from react-router-dom** or use the existing `useAppNavigate`
- Line 73: `Users` not imported. **Fix: add `Users` to the lucide import**
- Line 91: `ArrowUpRight` not imported. **Fix: add `ArrowUpRight` to the lucide import**

### 3. `src/components/LikeNotificationPreview.tsx` (4 errors)

- Lines 101-104: `null` values from Supabase queries assigned to `string | undefined` typed fields. **Fix: use `?? undefined` to convert nulls**
- Line 105: `firstListing?.images?.[0]` — images column returns `Json` type. **Fix: cast with `(firstListing?.images as string[] | null)?.[0]`**

### 4. `src/components/LikedClients.tsx` (2 errors)

- Line 345: `selectedClientForView` is `Record<string, unknown> | null` but modal expects `LikedClient | null`. **Fix: change state type to `LikedClient | null`** (line 54)
- Line 360: `clientToDelete?.full_name` but state is typed as `{ user_id: string }`. **Fix: expand type to `{ user_id: string; full_name?: string }`**

### 5. `src/components/MarketingSlide.tsx` (1 error)

- Line 169: `strokeWidth` prop passed to an icon component whose type only allows `className`. The icon comes from `slideData` which types icons as `React.ComponentType<{ className?: string }>`. **Fix: widen the icon type to include `strokeWidth`**, or remove `strokeWidth` from the JSX

### 6. `src/components/PropertyManagement.tsx` (2 errors)

- Line 107: `data.formData.mode || 'rent'` — `mode` is `unknown`, assigned to a string field. **Fix: cast `(data.formData.mode as string) || 'rent'`**
- Line 616: `editingProperty` is `Partial<Listing> | null` but prop expects `EditingListing | undefined`. **Fix: change to `editingProperty ?? undefined`**

### 7. `src/components/SwipessSwipeContainer.tsx` (1 error)

- Line 1240: `setCategories` from store is `(cats: QuickFilterCategory[]) => void` but `SwipeAllDashboardProps` types it as `(ids: string[]) => void`. **Fix: change `SwipeAllDashboardProps` to use `QuickFilterCategory[]`**

### 8. `src/hooks/useAnonymousDrafts.ts` (1 error)

- Line 166: `id` doesn't exist on the profiles insert type (profiles table uses `user_id` not `id` as the column for upsert matching). **Fix: change `id: user.id` to `user_id: user.id`**

### 9. `src/hooks/useContracts.tsx` (1 error)

- Line 108: `title` doesn't exist on the insert type for `digital_contracts`. The table schema likely uses different column names. **Fix: check the actual table schema and use `.insert({...} as any)` or correct column names**

### 10. `src/hooks/useConversations.tsx` (6 errors)

- Lines 227-234: Properties like `client_id`, `owner_id`, `listing_id`, `last_message_at`, `status` return `string | null` from DB but are typed as `string`. **Fix: add null coalescing `?? ''`** for required string fields, `?? undefined` for optional ones

### 11. `src/hooks/useRadioPlaylists.ts` (2 errors)

- Lines 40, 73: DB returns `station_ids` as `Json` (could be null) but `UserPlaylist` expects `string[]`. **Fix: cast the data: `setPlaylists((data || []).map(d => ({ ...d, description: d.description ?? undefined, station_ids: (d.station_ids as string[]) || [] })))`**

### 12. `src/hooks/useSwipeWithMatch.tsx` (1 error)

- Line 561: `match.client_id` doesn't exist on the match type which only has `user_id`. **Fix: use `match.user_id` directly instead of `match.client_id ?? match.user_id`**

### Summary

| File | Error Count | Fix Type |
|------|------------|----------|
| EventosFeed.tsx | ~25 | Delete dead code, add missing type field, add variable |
| EventoDetail.tsx | 3 | Add missing imports |
| LikeNotificationPreview.tsx | 4 | Null coalescing |
| LikedClients.tsx | 2 | Fix state types |
| MarketingSlide.tsx | 1 | Fix icon type |
| PropertyManagement.tsx | 2 | Type casting |
| SwipessSwipeContainer.tsx | 1 | Fix prop type |
| useAnonymousDrafts.ts | 1 | Fix column name |
| useContracts.tsx | 1 | Type casting |
| useConversations.tsx | 6 | Null coalescing |
| useRadioPlaylists.ts | 2 | Type casting |
| useSwipeWithMatch.tsx | 1 | Use correct field |

