

## Plan: Fix Authentication — Wrong Backend Credentials

### Root Cause

The app cannot sign in because it is connecting to the **wrong backend**. The `vite.config.ts` file contains hardcoded fallback values pointing to an old, disconnected project (`vplgtcguxujxwrgguxqq`) instead of the current one (`qegyisokrxdsszzswsqk`). Every login attempt hits the wrong server and gets rejected with "Invalid API key."

### Evidence

Network requests show:
- URL: `https://vplgtcguxujxwrgguxqq.supabase.co/auth/v1/token` (wrong project)
- API key: `placeholder-key`
- Response: `{"message":"Invalid API key"}`

### Fix (single file change)

**`vite.config.ts`** — Update 2 sections:

1. **Lines 15-16**: Change preconnect hints from old URL to `https://qegyisokrxdsszzswsqk.supabase.co`

2. **Lines 130-134**: Update the hardcoded fallback env vars to the correct project:
   - `VITE_SUPABASE_URL` → `https://qegyisokrxdsszzswsqk.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → the correct anon key (already known from project config)
   - `VITE_SUPABASE_PROJECT_ID` → `qegyisokrxdsszzswsqk`

No other files need to change. The auth flow, login page, and signup page code are all intact — they just need the correct backend connection.

