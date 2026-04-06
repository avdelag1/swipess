

# Fix Radio Page + Add Tavily Web Search + Fix Stale Cache

## Problem Summary

1. **Radio page shows blank** — The `/radio` route uses plain `lazy()` instead of `lazyWithRetry()`, so if the chunk fails to load (common after deploys), users see nothing. The route is inside `PersistentDashboardLayout` which has its own Suspense, but chunk failures aren't recovered.

2. **Tavily API key not integrated** — The key `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` is not stored as a secret and the `ai-orchestrator` edge function has no Tavily code.

3. **Old version showing in other browsers** — The PWA service worker + Cache API are caching old assets. Need to ensure the auto-update mechanism and cache-busting are working aggressively on the published site.

---

## Changes

### 1. Harden Radio Route (src/App.tsx)

- Replace `lazy(() => import("./pages/DJTurntableRadio"))` with `lazyWithRetry(() => import("./pages/DJTurntableRadio"))`
- Add `lazyWithRetry` import at top
- This ensures chunk load failures trigger a page reload instead of a blank screen

### 2. Add Tavily Secret

- Store the Tavily API key (`tvly-dev-...`) as a backend secret named `TAVILY_API_KEY`

### 3. Add Tavily Web Search to AI Orchestrator (supabase/functions/ai-orchestrator/index.ts)

Add a `searchWeb()` helper function:
- Calls `https://api.tavily.com/search` with the user's query
- Returns formatted results (title, URL, snippet)
- Only triggered when `concierge_knowledge` returns fewer than 2 results, giving curated data priority
- Results injected into system prompt as `--- LIVE WEB RESULTS ---` block after the knowledge block

Update `buildSystemPrompt()` to accept an optional web results block.

Update the main handler flow:
- Fetch knowledge first
- If knowledge results are sparse, also call Tavily
- Pass both blocks to `buildSystemPrompt()`

### 4. Fix Stale Version in Other Browsers

- Add aggressive cache-control headers to the service worker registration
- Add a version meta tag bump mechanism — update the `<meta name="app-version">` in `index.html` with current build timestamp
- Ensure the `useForceUpdateOnVersionChange` hook compares versions and forces reload when mismatch detected
- The existing `clearAllCaches` + `forceReload` utilities already handle this — the issue is the published site needs a fresh deploy after code changes. Will verify the publish flow is triggered.

### 5. Deploy Edge Function

- Redeploy `ai-orchestrator` after adding Tavily integration

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Switch radio import to `lazyWithRetry` |
| `supabase/functions/ai-orchestrator/index.ts` | Add Tavily web search helper, integrate into prompt pipeline |
| Secret: `TAVILY_API_KEY` | Store the provided API key |
| `index.html` | Bump app-version meta tag to force cache refresh |

## About the "old version" issue

When you publish from Lovable, frontend changes only go live after clicking "Update" in the publish dialog. Backend changes (edge functions, database) deploy immediately. If you're seeing an old version in another browser, it means either:
- The latest frontend hasn't been published yet (click Publish → Update)
- The other browser has a cached service worker — the cache-busting improvements will handle this going forward

