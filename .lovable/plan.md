## Goals

1. Bring the swipe action row (Undo · Dislike · Message · Like · Insights) visually closer/tighter.
2. Make right-swipe reliably save the listing/profile/worker (already wired — verify + add safety net).
3. Make left-swipe a **soft dismiss with cooldown**, not a permanent block.
4. Fix the notification flood (50 banners stacking, impossible to close).

---

## 1. Action Buttons — Tighter Cluster

File: `src/components/SwipeActionButtonBar.tsx`

- Reduce horizontal gap: `gap-1.5 sm:gap-2` → `gap-0.5 sm:gap-1` (about 2–4px between pills).
- Pull cluster up a bit more: `-mt-4` → `-mt-6`.
- Keep the size hierarchy already in place (Like/Dislike large ~72px, Undo/Message/Insights small ~52px) — only spacing changes, no layout rebuild.

---

## 2. Swipe-Right Save Verification

Files: `src/hooks/useSwipeWithMatch.tsx` (already saves into `likes` with `direction='right'` for both `listing` and `profile`).

- Audit confirms: client→listing, owner→profile, and worker listings (which are stored in `listings` with `category='service'`) all funnel through the same right-swipe path. No code change needed here beyond a small log-on-success in production logger so we can verify in edge logs.
- Add a tiny defensive retry (one retry on transient network error) inside the right-swipe upsert.

---

## 3. Soft-Dismiss Cooldown (24h → permanent on second left swipe)

### 3a. Schema (migration)

Add to `public.likes`:
- `dismissed_at timestamptz` (nullable) — timestamp of the most recent left swipe.
- `dismiss_count int default 0` — number of times user has left-swiped this target.
- `cooldown_until timestamptz` (nullable) — when the card is allowed to reappear; `NULL` means permanent.

Backfill: existing rows with `direction='left'` get `dismiss_count = 1`, `cooldown_until = NULL` (treat legacy left-swipes as permanent so we don't suddenly resurface old dismissals).

### 3b. Write path

`useSwipeWithMatch.tsx` left-swipe branch (both listing and profile):

```text
fetch existing row for (user_id, target_id, target_type)
if no row OR dismiss_count == 0:
   upsert direction='left', dismiss_count=1, dismissed_at=now(),
          cooldown_until = now() + 24h    -- soft
else:
   upsert direction='left', dismiss_count = existing+1, dismissed_at=now(),
          cooldown_until = NULL           -- permanent
```

### 3c. Read/filter path

`useSwipeDismissal.tsx`:
- Select `target_id, cooldown_until, dismissed_at`.
- A target is considered "currently dismissed" if `cooldown_until IS NULL` (permanent) **or** `cooldown_until > now()`.
- Otherwise the cooldown has expired → not in the dismissed set → card reappears in the deck.

Listing-update override: when fetching listings for the deck, also pass each listing's `updated_at`. If a dismissal exists but the listing's `updated_at > dismissed_at`, exclude it from the dismissed set too (price/details changed → show again).

### 3d. UX copy
First left-swipe shows a subtle banner "We'll show this again in 24h if you change your mind." (one toast only, throttled).

---

## 4. Notification Flood Fix

Root cause (`useNotificationSystem.tsx` + `NotificationBar.tsx`):
- On mount, up to 50 historical DB notifications are pushed into the store with `read: notif.is_read || false`. Anything still unread becomes a banner. The bar plays them one at a time (5 s each + queue), so the user sees "50 new" and the X only dismisses the current one.

Fix:
1. **Initial fetch**: only push notifications from the last 24 h **and** mark anything older than 60 s as `read: true` so they don't queue as banners. Older items stay accessible from the bell/popover, just not as live pop-ups.
2. **Aggregate banner**: when `unread.length > 1`, the bar already shows "N new notifications". Add a second action button: **Dismiss all** → calls `markAllAsRead()` (local) + bulk `update is_read=true` in DB. The single X stays for one-by-one.
3. **Dedup hardening**: in `notificationStore.addNotification`, also dedupe by `(type + relatedUserId + message)` within a 10 s window so realtime + initial fetch races can't double-insert.
4. **Cap**: reduce store cap from 50 → 20 banners; bell list still pulls full history from DB.
5. **Tap-outside-to-dismiss-all**: tapping anywhere on the banner already dismisses current — when aggregate mode is showing, tap navigates to `/notifications` and clears the queue.

---

## Files to change

- `src/components/SwipeActionButtonBar.tsx` — spacing only.
- `src/hooks/useSwipeWithMatch.tsx` — left-swipe cooldown logic, retry on right-swipe.
- `src/hooks/useSwipeDismissal.tsx` — cooldown-aware filter + listing-update override.
- `src/components/NotificationBar.tsx` — "Dismiss all" button in aggregate mode.
- `src/hooks/useNotificationSystem.tsx` — recent-only fetch, mark old as read.
- `src/state/notificationStore.ts` — dedup window, cap 20.
- New migration: add `dismissed_at`, `dismiss_count`, `cooldown_until` to `likes` + backfill.

No layout, routing, or swipe-physics changes. Pure spacing + behavior fixes.
