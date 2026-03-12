
Do I know what the issue is? Yes.

What I found from the current code + runtime data:
1) The app is still calling an old backend project at runtime (wrong project URL/key fallback path), so auth/data calls can succeed against the wrong backend and break dashboard assumptions.
2) `/dashboard` mounts a very heavy tree, and `SwipessSwipeContainer` currently has duplicate filter-reset flows that both mutate local state/deck/page. Under filter hydration this can repeatedly reset and trigger React error #185 (maximum update depth).
3) Notification subscriptions are duplicated (global + dashboard-level), which increases re-render pressure and makes the crash easier to hit.

Implementation plan (hotfix first, then hardening):

Phase 1 — Stop the dashboard render loop
- File: `src/components/SwipessSwipeContainer.tsx`
- Remove the older filter-reset effect and keep only one signature-based reset path.
- Ensure all deck reset mutations (`setPage`, `setCurrentIndex`, `setDeckLength`, `resetClientDeck`) run in one guarded effect only.
- Move any render-time change detection side effects to effects/refs (no state-affecting logic in render path).
- Add strict guard so a filter reset only runs when the signature actually changes.

Phase 2 — Fix backend project drift (critical)
- Resolve backend client configuration so runtime uses only the current Lovable Cloud project values (no stale fallback values).
- Add a startup guard that logs/blocks if runtime backend host doesn’t match current project env, to prevent silent drift in future.

Phase 3 — Reduce re-render pressure
- Keep one notification subscription source for dashboard context (avoid double real-time listeners).
- Prevent duplicate `NotificationBar` mounts for the same route.
- Keep unread counters and notification state updates batched.

Phase 4 — Defensive error-loop hardening
- In smart-matching hooks and dashboard data hooks, return stable fallback data on transient backend failures (no cascading state writes/toasts).
- Throttle repeated failure handling so persistent backend errors do not trigger update storms.

Phase 5 — Verify end-to-end before closing
- Confirm `/dashboard` loads without error boundary.
- Confirm no React #185 after refresh + navigating between dashboard/messages/notifications.
- Confirm requests target the current backend project only.
- Confirm swipe decks load/reset correctly when changing quick filters.
- Confirm no duplicate notification listener behavior.

Technical details (exact files to update)
- `src/components/SwipessSwipeContainer.tsx` (primary loop fix)
- `src/components/AppLayout.tsx` and/or `src/pages/ClientDashboard.tsx` / `src/components/EnhancedOwnerDashboard.tsx` (dedupe notification bar/listener mount points)
- `src/hooks/smartMatching/useSmartListingMatching.tsx`
- `src/hooks/smartMatching/useSmartClientMatching.tsx`
- Backend client config path (runtime project-source correction, using current Lovable Cloud env only)

Expected outcome
- Dashboard opens normally.
- React error #185 is eliminated.
- Data/auth calls consistently hit the correct backend project.
- No repeated crash loop after login/refresh.
