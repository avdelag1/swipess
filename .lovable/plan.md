
Root cause is likely not the dashboard component itself but the preload chain around it.

What I found:
- The current runtime error is `Failed to fetch dynamically imported module: /src/components/LikedListingInsightsModal.tsx`.
- `LikedListingInsightsModal` is used by `src/pages/ClientLikedProperties.tsx`.
- `/client/liked-properties` is aggressively prefetched from `src/components/DashboardLayout.tsx` via `prefetchRoleRoutes('client')`.
- That means the dashboard can trigger loading of the liked-properties page in the background, which can pull the modal chunk before the user ever opens that page.
- `src/utils/lazyRetry.ts` force-reloads the whole app on lazy-import failure, so one bad chunk fetch can look like an endless crash/reload loop.
- `GlobalDialogs.tsx` is no longer importing `LikedListingInsightsModal`, so the remaining suspect path is route prefetching.

Plan to fix it:
1. Harden the immediate crash path
- Remove `/client/liked-properties` from the client “critical” prefetch list in `src/utils/routePrefetcher.ts`.
- Keep prefetching lighter routes first so dashboard boot stops pulling the failing modal chain in the background.

2. Reduce loop behavior from lazy import recovery
- Update `src/utils/lazyRetry.ts` so failed dynamic imports do not blindly reload the entire app from any route.
- Make it retry once in a controlled way, then surface the error instead of entering a reload cycle.

3. Isolate the heavy liked-properties modal dependency
- Convert `LikedListingInsightsModal` usage inside `src/pages/ClientLikedProperties.tsx` to a local lazy boundary or defer its load until `showInsightsModal === true`.
- This keeps the modal chunk out of the initial liked-properties page graph.

4. Verify the modal module itself is safe
- Review `src/components/LikedListingInsightsModal.tsx` for anything that can break module evaluation on import, especially routing hooks and large top-level imports.
- Keep all router hooks inside component execution only and avoid any import-time side effects.

5. Add a safer fallback path for users
- Ensure the liked-properties page still renders even if the insights modal chunk fails.
- Show a non-blocking fallback instead of crashing the route or reloading the app.

Technical details:
- Files to update:
  - `src/utils/routePrefetcher.ts`
  - `src/utils/lazyRetry.ts`
  - `src/pages/ClientLikedProperties.tsx`
  - possibly `src/components/LikedListingInsightsModal.tsx`
- Expected result:
  - dashboard stops background-triggering the bad chunk
  - no more endless reload behavior
  - liked-properties can load independently
  - modal failure, if any remains, is contained instead of taking down the app

Secondary cleanup I also noticed:
- There is a React warning from `fetchPriority` leaking onto a DOM `<img>` through the avatar stack. That is not the crash, but I would clean it after the loop is fixed.

