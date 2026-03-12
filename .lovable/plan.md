
I found two concrete issues that explain why access keeps breaking:

1) Build is currently blocked by a TypeScript error:
- `src/components/swipe/SwipeStates.tsx` imports `CategoryInfo` from `SwipeUtils`, but `SwipeUtils` does not export it.

2) The app is still wired to an old backend fallback in code:
- `src/integrations/supabase/client.ts` fallback URL/key still point to the old project.
- `index.html` preconnect hints also point to the old project.
This matches your 404 logs and can trigger the React #185 crash loop after sign-in.

Implementation plan (single recovery pass):

1. Unblock build immediately (swipe type fix)
- File: `src/components/swipe/SwipeUtils.tsx`
  - Export `CategoryInfo` type.
  - Type `getActiveCategoryInfo` to return `CategoryInfo`.
  - Include required `icon` + `color` fields in category config so `SwipeStates` always gets valid values.
- File: `src/components/swipe/SwipeStates.tsx`
  - Keep using `CategoryInfo` but as a proper exported type (type-safe import).

2. Remove backend drift without touching auto-generated backend client file
- File: `vite.config.ts`
  - Add reliable build-time `define` values for:
    - `import.meta.env.VITE_SUPABASE_URL`
    - `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
    - `import.meta.env.VITE_SUPABASE_PROJECT_ID`
  - This ensures runtime never falls back to the old backend host.
- File: `index.html`
  - Replace stale preconnect host with the current backend host (or remove hardcoded static preconnect and let Vite/plugin inject correct one).

3. Stop post-login crash loops
- Audit and harden query error paths that can repeatedly set state/toast on failed fetches (especially owner preference query path).
- Ensure missing-table/404 responses short-circuit cleanly without repeated UI state churn.

4. Validate AI and access end-to-end
- Smoke test:
  - Sign up / sign in / dashboard route.
  - Confirm no requests go to old backend host.
  - Confirm no React #185 after login.
  - Run one AI prompt through `ai-orchestrator` flow and verify response returns (Gemini primary, MiniMax fallback path still available).

Technical patch scope
- `src/components/swipe/SwipeUtils.tsx`
- `src/components/swipe/SwipeStates.tsx`
- `vite.config.ts`
- `index.html`
- (if needed after quick check) one or two query hooks for loop hardening

Acceptance criteria
- Build passes (no TS2305 in SwipeStates).
- No old backend hostname in network calls.
- Login lands on dashboard without crash.
- AI response succeeds in app chat flow.

<lov-actions>
<lov-suggestion message="Test the full flow end-to-end: sign up, sign in, open dashboard, swipe once, and send one AI message to confirm stability.">Verify end-to-end</lov-suggestion>
<lov-suggestion message="Implement a startup health check panel that validates backend connectivity, auth session, and AI orchestrator availability before rendering the main app.">Add startup health checks</lov-suggestion>
<lov-suggestion message="Add a global error telemetry banner that captures React runtime crashes and failed API endpoints so future regressions are detected instantly.">Add runtime error telemetry</lov-suggestion>
</lov-actions>
