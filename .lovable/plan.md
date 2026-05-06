## Diagnosis

### 1. Listing creation (Properties not saving)

The form at `src/components/UnifiedListingForm.tsx` looks correct on paper — it sets `user_id`, `owner_id`, the RLS policy is `auth.uid() = user_id`, and the schema accepts every column we send. But there are two real failure surfaces:

- **Silent UI hang** — `createListingMutation.mutate()` runs an upload + insert chain. If `uploadPhotoBatch` fails, the rejection bubbles into `onError`, and it does call `appToast.error(...)`. However, `appToast` writes to `useNotificationStore`. If `<NotificationSystem />` is not mounted (or filters out errors), the user sees nothing — exactly the symptom: "thinking forever, no banner".
- **Insert validation** — for properties, `price` is sent as `Number(formData.price) || 0`, `title` defaults to `"New property"`, and `location` is `"Tulum"` if blank, so RLS/NOT NULL should not reject. The most common silent failure is the photo upload hanging on a slow connection or returning a 403 because the storage path uses `userId/...` which matches policy `(storage.foldername(name))[1] = auth.uid()::text` — fine. But if `auth.uid()` is briefly null (session refreshing), upload returns 403 and the user sees the spinning button.

### 2. "Laser light moving behind pages"

This is the conic-gradient ring inside `UnifiedListingForm.tsx` lines 696–712 — an infinite 1.5s rotating glow placed behind the Publish button using `-inset-[2px]` and `inset-[-100%]`. On some screens it bleeds outside the button's bounds and "leaks" across the page when the modal is open or transitioning.

### 3. Insights modal scrolling

Already uses `ScrollArea` inside `92dvh` — confirmed scroll works. No change needed.

---

## Fix Plan

**A. Make listing save bulletproof and visible**

In `src/components/UnifiedListingForm.tsx`:
1. Wrap `createListingMutation.mutate()` so we **immediately** show `appToast.info("Publishing...", "Uploading photos and saving.")`.
2. In `mutationFn`, before upload, re-check the session via `supabase.auth.getSession()`; if null, throw a clean `"Session expired — please log in again."`.
3. Add a final fallback in `onError`: also call `console.error` and `alert()` if `appToast` is the only channel — guarantees the user sees something.
4. After the photo upload step, log progress with `appToast.info(...)` so users know it's still alive past 5–10 seconds.

**B. Contain the "laser"**

In `UnifiedListingForm.tsx`:
- Add `overflow-hidden rounded-[18px]` to the wrapper around the rotating conic gradient (the `motion.div` at line 697) so the rotating square is clipped to the button's bounds.
- Lower `opacity` from `100%` to `60%` and only show on `:hover` (already gated by `group-hover`, but ensure parent has `group` class and `relative isolate`).
- Wrap the button in a container with `isolate` so the glow can't escape during page transitions.

**C. Connect notifications globally**

Verify `<NotificationSystem />` is mounted in `App.tsx` at the root level so every page can receive `appToast` events. If missing, add it once near the layout root.

**D. Owner messaging path** (already partially fixed last turn)

Confirm the message buttons across `LikedClients`, `LikedListingInsightsModal`, `OwnerViewClientProfile`, and `LikedClientInsightsModal` all:
- Show "Starting chat..." toast immediately
- Catch errors and surface them via `appToast.error`
- Fall back to navigating `/messages` even if conversation creation succeeds without a returned id (refetch + open most recent)

---

## Files Touched

- `src/components/UnifiedListingForm.tsx` — visible publishing flow + clip the conic glow
- `src/App.tsx` — ensure `<NotificationSystem />` is mounted at root (check first, add if missing)
- `src/components/LikedListingInsightsModal.tsx` — same toast-on-message guarantee as already added to `LikedClients.tsx`

No database migrations. No new dependencies.