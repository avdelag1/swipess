---
name: deploy-ai
description: >-
  Deploy Swipess Supabase AI edge functions to production. Use when the user
  says deploy AI, deploy edge functions, deploy concierge, update AI backend,
  or runs /deploy-ai.
---

# Deploy AI edge functions

## Functions (default set)

`npm run deploy:ai` deploys:

- `ai-concierge`
- `voice-transcribe`
- `ai-profile-extract`
- `ai-enhance-text`
- `ai-listing-extract`

Other functions live under `supabase/functions/` (push, purchases, link-preview, moderation, etc.). Deploy those only when the user names them:

```bash
npx supabase functions deploy <function-name>
```

## Steps

1. Confirm cwd is the **swipess** repo root.
2. Summarize what changed under `supabase/functions/` (or confirm user wants full AI set).
3. Ensure Supabase CLI is available and the user is logged in / linked to prod.
4. Run:
   ```bash
   npm run deploy:ai
   ```
   Or deploy a single function if scope is narrow.
5. Report success/failure per function. Do not print secret values from env or dashboard.
6. If deploy needs secrets (`GROQ_API_KEY`, `MINIMAX_API_KEY`, VAPID, etc.), remind the user they are set in **Supabase Dashboard → Edge Functions → Secrets**, not in `VITE_*`.

## Do not

- Put service-role or AI keys in client `VITE_*` vars.
- Deploy unrelated functions without being asked.
- Commit local secret files.
