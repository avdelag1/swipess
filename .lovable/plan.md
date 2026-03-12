

## Problem

The `/dashboard` route is a "dead" path that shows a blank/broken page. Multiple places in the app navigate to `/dashboard` instead of the role-specific `/client/dashboard` or `/owner/dashboard`, trapping users on a non-functional page. The user keeps getting stuck there.

Additionally, the backend client file (`src/integrations/supabase/client.ts`) has hardcoded fallback values pointing to an OLD project (`vplgtcguxujxwrgguxqq`), while the actual Lovable Cloud project is `qegyisokrxdsszzswsqk`. This means all data requests hit the wrong backend.

## Root Causes

1. **`/dashboard` route exists** in `App.tsx` (line 283) as a shared route rendering `<MyHub />`, but it has no role context and breaks layout derivation
2. **Several navigation paths** send users to `/dashboard` instead of role-specific paths:
   - `TopBar.tsx` center tap zone (line 256)
   - `useActiveMode.tsx` fallback navigation (line 242)
   - `DashboardLayout.tsx` swipe navigation paths (lines 316, 323)
   - `AITestPage.tsx` back button (line 122)
3. **Backend project drift**: `client.ts` falls back to project `vplgtcguxujxwrgguxqq` (old project) when env vars are missing, causing 400 errors on listing fetches

## Plan

### Phase 1: Remove /dashboard route and fix all references

**`src/App.tsx`** (line 283):
- Delete the route `<Route path="/dashboard" element={<MyHub />} />`

**`src/components/TopBar.tsx`** (line 256):
- Change `navigate('/dashboard')` to navigate to the mode-specific dashboard using `useActiveMode`:
  - `navigate(activeMode === 'owner' ? '/owner/dashboard' : '/client/dashboard')`

**`src/hooks/useActiveMode.tsx`** (line 242):
- Change fallback `navigate('/dashboard')` to `navigate('/client/dashboard')`

**`src/components/DashboardLayout.tsx`** (lines 316, 323):
- Replace `'/dashboard'` in `clientSwipePaths` with `'/client/dashboard'`
- Replace `'/dashboard'` in `ownerSwipePaths` with `'/owner/dashboard'`
- Update `isOnDiscoveryPage` check (line 539-540) to remove `|| location.pathname === '/dashboard'`
- Update `immersiveRoutes` array (line 570) to remove `'/dashboard'`

**`src/components/PersistentDashboardLayout.tsx`** (lines 31-33):
- Remove the `/dashboard` case from `getRoleFromPath`

**`src/pages/AITestPage.tsx`** (line 122):
- Change `navigate('/dashboard')` to `navigate('/client/dashboard')`

### Phase 2: Add redirect catch for /dashboard

In `App.tsx`, add a redirect route so any bookmarks or stale links to `/dashboard` automatically go to the right place:
```
<Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
```
This is placed OUTSIDE the protected route group as a simple redirect.

### Phase 3: Fix backend project drift

The auto-generated `src/integrations/supabase/client.ts` currently has hardcoded fallback values pointing to the OLD project. Since this file is auto-generated and must not be edited manually, this issue needs to be resolved by ensuring the `.env` values are always loaded. The `.env` file already has the correct values (`qegyisokrxdsszzswsqk`), so the fallback in the generated file should not normally activate. However, I will verify the env loading path is correct.

### Phase 4: Update test file

**`src/test/indexNavigation.test.tsx`**:
- No changes needed -- tests already assert navigation to `/client/dashboard` and `/owner/dashboard`

### Files to modify
1. `src/App.tsx` -- remove route, add redirect
2. `src/components/TopBar.tsx` -- fix center tap navigation
3. `src/hooks/useActiveMode.tsx` -- fix fallback navigation
4. `src/components/DashboardLayout.tsx` -- fix swipe paths + discovery check
5. `src/components/PersistentDashboardLayout.tsx` -- remove /dashboard case
6. `src/pages/AITestPage.tsx` -- fix back button

### Expected outcome
- `/dashboard` no longer exists as a renderable page
- Any access to `/dashboard` redirects to `/client/dashboard`
- All navigation paths use role-specific dashboard routes
- Users always land on a working, role-aware dashboard
- Landing page and auth flow remain unchanged for logged-out users

