
# Full App Audit — SwipesS (Front-End + Back-End)

## Summary of Findings

After a complete read of every critical layer — auth, routing, data, UI components, CSS, edge functions, and database hooks — I identified **17 concrete issues** across 4 severity levels. Each is described with its exact location and fix.

---

## CRITICAL BUGS (Will break features)

### 1. `useSwipeSounds` queries by wrong column — always fails silently
**File:** `src/hooks/useSwipeSounds.ts` — Line 35
**Bug:** The query filters `.eq('id', user.id)` but the `profiles` table uses `user_id` as the auth FK column. The `id` column is an auto-generated UUID unrelated to `auth.uid()`. Every sound theme load fails silently with PGRST116 ("0 rows"), which is confirmed in the console logs every session.
**Fix:** Change `.eq('id', user.id)` → `.eq('user_id', user.id)`.

### 2. `DialogContent` has no `hideCloseButton` prop — TypeScript suppressed by `@ts-nocheck`
**File:** `src/components/AISearchDialog.tsx` — Line 308
**Bug:** `DialogContent` is passed `hideCloseButton={true}`, but the Radix `DialogContent` component from shadcn does not have this prop. The close button renders anyway unless the prop was manually added in `dialog.tsx`. Because the file uses `// @ts-nocheck`, no type error surfaces.
**Fix:** Verify `dialog.tsx` accepts and implements `hideCloseButton`, otherwise remove the prop and hide the close button via CSS or render a custom one. This ensures no phantom close button sits over content.

### 3. Navigation badge count uses `bg-orange-500` — inconsistent with brand tokens
**File:** `src/components/BottomNavigation.tsx` — Lines 206, 217
**Bug:** The notification badge and active icon use `bg-orange-500` / `text-orange-300` which are Tailwind hardcoded classes. The rest of the app uses the orange→pink gradient token via inline styles. On some light themes this orange can clash. **Also:** the active indicator dot and badge color don't match the TopBar's gradient badge color. Visual inconsistency.
**Fix:** Replace hardcoded `bg-orange-500` with the brand gradient via `style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}` matching TopBar and everywhere else.

### 4. `upsert_user_role` DB function has a conflict bug
**File:** `supabase/functions` / `has_role` function (DB)
**Bug:** The `upsert_user_role` function uses `ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role` — but the UNIQUE constraint on `user_roles` is on `(user_id, role)` not just `user_id`. This means the upsert can insert a *second row* for the same user with a different role instead of updating, violating intent. A user could get both a `client` and `owner` role row simultaneously.
**Fix:** Add a migration to change the `user_roles` unique constraint to `UNIQUE (user_id)` only, OR rewrite the function to `DELETE + INSERT`.

---

## HIGH SEVERITY (Visual/UX regressions)

### 5. AI Search Dialog — `handleClose` is referenced in `handleAction` before declaration
**File:** `src/components/AISearchDialog.tsx` — Lines 274–287
**Bug:** `handleAction` calls `handleClose()` at line 279, but `handleClose` is `useCallback`-declared *after* it at line 281. In JS/TS hoisting, function expressions (arrow functions) assigned to `const` are NOT hoisted. This works at runtime because both are in the same closure scope but can cause issues in React strict mode with double-invocation. The clean fix is to declare `handleClose` before `handleAction`.
**Fix:** Reorder the two `useCallback` declarations — `handleClose` first, then `handleAction`.

### 6. `TopBar` — Notifications bell uses `onClick` instead of `onPointerDown` inconsistently
**File:** `src/components/TopBar.tsx` — Line 354
**Bug:** The AI Search button correctly uses `onPointerDown` for instant response, but this was partially fixed. The Notifications bell also uses `onPointerDown` correctly. However, the `Tokens` Popover trigger still uses a regular `onClick` (via `PopoverTrigger`) with no `onPointerDown` optimization. This means the Tokens button still has the ~300ms delay on mobile.
**Fix:** Wrap the `PopoverTrigger` button with `onPointerDown` that sets `tokensOpen(true)` for instant response.

### 7. `AISearchDialog` — `userAvatar` reads from `profile_images[0]` which is a client_profiles column, not `profiles.avatar_url`
**File:** `src/components/AISearchDialog.tsx` — Line 217
**Bug:** `useClientProfile()` returns data from `client_profiles` table, and `profile_images` is a `jsonb[]` array of uploaded photo URLs. Users who haven't uploaded photos to their client profile will see no avatar even if they set one via `profiles.avatar_url`. Most users only have `avatar_url`.
**Fix:** Fallback chain: `clientProfile?.profile_images?.[0] ?? clientProfile?.avatar_url ?? null` — or better, also import `useProfile` and check `profiles.avatar_url`.

### 8. `DashboardLayout` — `// @ts-nocheck` suppresses potential type errors across 767 lines
**File:** `src/components/DashboardLayout.tsx` — Line 1
**Issue:** This is the most critical layout component in the app but is completely type-unsafe. Several hooks and state variables could have undefined-at-runtime edge cases that TypeScript would normally flag.
**Fix:** Remove `// @ts-nocheck` and fix the resulting type errors one by one. This is a risk-reduction fix, not a single-line change — it should be done carefully.

### 9. Missing `owner/discover` route — owner nav links to `/owner/dashboard` but `EnhancedOwnerDashboard` is a component, not at a discover route
**File:** `src/App.tsx` — Line 231, `src/components/BottomNavigation.tsx` — Line 90
**Bug:** Owner's nav "Home" button points to `/owner/dashboard` which correctly routes to `EnhancedOwnerDashboard`. However, `OwnerDashboardNew` is also lazy-imported but not routed anywhere in `App.tsx`. This dead import adds to bundle size with no benefit.
**Fix:** Remove the `OwnerDashboardNew` lazy import from `App.tsx` if it is not used, or add a route for it.

---

## MEDIUM SEVERITY (Performance / Minor Logic Bugs)

### 10. `QueryClient` has no `throwOnError` — silent failures swallowed
**File:** `src/App.tsx` — Lines 122–138
**Issue:** Query errors are logged but not surfaced to users in many places (toast is only shown in specific hooks). The global `QueryClient` should have an `onError` global handler so truly unexpected DB errors can at least be caught in one place for monitoring.
**Fix:** Add a `queryCache: new QueryCache({ onError: (error) => logger.error('[Query] Uncaught error:', error) })` to the QueryClient config.

### 11. `useSwipeSounds` — pre-loads audio on every theme change but never cleans up old `HTMLAudioElement`
**File:** `src/hooks/useSwipeSounds.ts` — Lines 59–75
**Bug:** When the theme changes, the refs are set to `null` (clearing the ref) but the old `HTMLAudioElement` objects are not explicitly paused or `src` cleared, causing them to linger in memory.
**Fix:** Before nulling the refs, call `leftAudioRef.current?.pause(); leftAudioRef.current?.src = '';` to properly release resources.

### 12. `AISearchDialog` quick-prompt grid has a CSS class that doesn't exist in Tailwind
**File:** `src/components/AISearchDialog.tsx` — Line 355
**Bug:** `hover:bg-white/8` — Tailwind does not ship an `8` opacity step. Valid opacity values are multiples of 5 (5, 10, 15…). This class does nothing.
**Fix:** Change `hover:bg-white/8` to `hover:bg-white/10`.

### 13. `BottomNavigation` — Owner gets 6 nav items but CSS allocates space for 5
**File:** `src/components/BottomNavigation.tsx` — Lines 86–126
**Issue:** The owner nav array has 6 items (`browse`, `profile`, `liked`, `listings`, `messages`, `filter`). On narrow screens (iPhone SE, 320px) this can cause the buttons to overflow or compress below their `minWidth: 48` target, breaking the touch targets. The client has 5 items and fits fine.
**Fix:** Consider reducing owner nav to 5 items (merge Liked and Listings into one, or put Listings in the settings page), or add a CSS `gap` clamp that shrinks on small screens.

### 14. `notifications` RLS — INSERT policy allows `related_user_id = auth.uid()` which means anyone can create a notification for any user
**File:** DB RLS — `notifications` table
**Bug:** The INSERT policy is:
```
(auth.uid() IS NOT NULL) AND ((related_user_id = auth.uid()) OR (user_id = auth.uid()))
```
The `related_user_id = auth.uid()` branch allows an authenticated user to insert a notification targeted at *any* `user_id` as long as they set themselves as `related_user_id`. This is a **security vulnerability** — any user can send a fake notification to any other user.
**Fix:** Change the INSERT policy to only allow `user_id = auth.uid()` (users can only create notifications for themselves), OR restrict it to server-side (service role) only and remove the client-side INSERT policy entirely.

---

## LOW SEVERITY (Polish / UX Debt)

### 15. `index.css` — `body` and `#root` both set `overflow-x: hidden` twice redundantly
**File:** `src/index.css` — Lines 56, 67
**Issue:** Minor redundancy, harmless but adds noise.
**Fix:** Remove the duplicate from `#root` since it's already on `html` and `body`.

### 16. `TopBar` `center tap zone` uses `onClick` for navigation — not `onPointerDown`
**File:** `src/components/TopBar.tsx` — Lines 158–165
**Issue:** The invisible center of the header bar that navigates back to the dashboard still uses `onClick`. This is a minor inconsistency with the "instant touch" optimization applied to the other buttons.
**Fix:** Change to `onPointerDown` with `e.preventDefault()`.

### 17. `AISearchDialog` — no `key` on the `AnimatePresence` messages map (each message uses `timestamp` — OK, but AnimatePresence itself needs a stable `key`)
**File:** `src/components/AISearchDialog.tsx` — Line 365
**Issue:** `AnimatePresence` wraps the `.map()` directly. This is correct, but in React strict mode the component double-mounts, which can cause duplicate "typing" animations. Adding a `key={messages.length}` to the `AnimatePresence` is a safe guard.
**Fix:** Add `key={messages.length}` to the outer `AnimatePresence` on the messages block.

---

## Implementation Plan

The fixes are grouped by impact and file to minimize diff size:

### Phase 1 — Critical Backend + Security (1 migration + 2 hook fixes)
- **DB migration:** Fix `user_roles` unique constraint + `notifications` INSERT RLS policy
- **`useSwipeSounds.ts`:** Fix `.eq('id')` → `.eq('user_id')` + add audio cleanup
- **`AISearchDialog.tsx`:** Fix `handleClose` declaration order + fix `hover:bg-white/8` → `/10` + fix avatar fallback chain + fix `AnimatePresence` key

### Phase 2 — UI Consistency (3 component fixes)
- **`BottomNavigation.tsx`:** Replace `bg-orange-500` with brand gradient on badge + active indicator
- **`TopBar.tsx`:** Add `onPointerDown` to Tokens button + fix center tap zone
- **`App.tsx`:** Remove unused `OwnerDashboardNew` lazy import + add QueryClient error logger

### Phase 3 — Type Safety
- **`DashboardLayout.tsx`:** Remove `@ts-nocheck` and resolve type errors

### Technical Notes
- The DB migration for `notifications` RLS is the most impactful security fix and will be done first
- The `user_roles` unique constraint change must be done with care if any users currently have duplicate rows — a cleanup query will run first
- All CSS class fixes are zero-risk single-character changes
- `@ts-nocheck` removal in `DashboardLayout` may surface additional issues — those will be fixed in-place
