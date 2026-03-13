
Goal: fix two blocking issues reported by you: (1) stars not visible on the main authenticated page, and (2) profile save/create failing with 400 errors (which also blocks listing confidence).

What I found (root causes)
1) Backend mismatch is likely the primary blocker for saves  
- Runtime network logs show requests going to `vplgtcguxujxwrgguxqq...` (old backend), while this project is configured for a different Cloud backend.  
- `src/integrations/supabase/client.ts` contains hardcoded fallback URL/key pointing to that old project. If env vars are missing/misnamed at runtime, app silently talks to the wrong backend and schema/policy mismatches cause 400s.

2) Profile update path is brittle for opaque 400s  
- `useSaveClientProfile` and `useSaveOwnerProfile` are mostly correct, but they throw raw backend objects and don’t normalize payloads/diagnostics enough, making debugging difficult when backend rejects a field.

3) Stars are only mounted on landing/auth view  
- `LandingBackgroundEffects` is used in `LegendaryLandingPage` only.  
- Authenticated pages (`/client/profile`, dashboards) use `VisualEngine`, which currently renders gradient/noise only—no stars layer.

Implementation plan
Phase 1 — Fix backend connection first (highest priority)
- Restore the generated backend client wiring so all requests target this project’s active Cloud backend only (no old-project fallback usage).
- Ensure the runtime key var names match what the app expects.
- Verify with network logs that requests are now sent to the correct backend domain before any further debugging.

Phase 2 — Stabilize profile save/create flow
Files:
- `src/hooks/useClientProfile.ts`
- `src/hooks/useOwnerProfile.ts`
- `src/components/ClientProfileDialog.tsx` (error UX only)

Changes:
- Normalize mutation payloads before update/insert (drop `undefined`, keep explicit `null` only when intentional).
- Prefer row targeting by `user_id` for updates (unique and auth-aligned) to avoid id-shape edge cases.
- Add structured error capture (`message`, `code`, `details`, `hint`) and surface that in toast-friendly form.
- Keep profile-table sync non-blocking (already mostly done), but make logging deterministic and consistent in both hooks.
- Add guarded retry (`retryWithBackoff`) around update/insert only for transient failures.

Phase 3 — Make stars visible on the “main page” too
Files:
- `src/visual/VisualEngine.tsx`
- (optional) new lightweight star layer component in `src/visual/`

Changes:
- Add a global star canvas layer in `VisualEngine` so authenticated pages (dashboard/profile) also show stars.
- Keep it non-interactive (`pointer-events:none`) and low-cost.
- Use theme-aware rendering:
  - white theme: darker stars + `normal/multiply` style rendering
  - dark theme: bright stars + `screen` rendering
- Keep existing landing effect modes/toggle untouched.

Phase 4 — Listing confidence check
Files:
- `src/components/UnifiedListingForm.tsx` (error mapping only)

Changes:
- Improve error mapping so listing failures clearly show backend cause.
- Confirm listing create/update works after Phase 1 (same backend client dependency).

Technical details (concise)
- No database schema migration is required for this fix set initially; current table/policy definitions for `client_profiles`, `owner_profiles`, `profiles`, and `listings` are already present.
- The 400 is most likely from wrong-backend runtime targeting + payload rejection on that backend, not from missing local hook retries alone.
- Console messages about iframe sandbox/CORS for manifest and some tooltip accessibility warnings are secondary; they are not the primary cause of profile save failure.

Validation checklist (end-to-end)
1) Save client profile with at least one uploaded photo → success toast + persisted reload.
2) Save owner profile → success + sync updates reflected in shared profile fields.
3) Create a listing from owner flow → success + listing appears in owner listings.
4) Verify stars are visible on:
   - landing `/`
   - authenticated main pages (`/client/profile`, `/client/dashboard`)
   in both white and dark themes.
5) Re-check network: all backend calls must hit the active Cloud project endpoint (no old fallback endpoint).

