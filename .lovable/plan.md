

## Plan: Route AI Data Queries to Production Backend + Fix Runtime Error

### The Problem

The AI concierge edge function runs on Lovable Cloud but its database queries (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) automatically point to Lovable Cloud's own database — not your production Supabase (`vplgtcguxujxwrgguxqq`). This means the AI sees potentially stale or different data from what your real users and listings actually are.

### Changes

**1. Add production database secrets to Lovable Cloud**

Create two new secrets so the edge function can query the production database:
- `PROD_SUPABASE_URL` → `https://vplgtcguxujxwrgguxqq.supabase.co`
- `PROD_SUPABASE_SERVICE_ROLE_KEY` → your production service role key

**2. Update `supabase/functions/ai-concierge/index.ts`** — Switch data queries to production

Change lines 12-14 to use the production secrets for all data reads (knowledge, listings, profiles, memories):

```typescript
// Data reads go to PRODUCTION Supabase (user's real backend)
const PROD_SUPABASE_URL = Deno.env.get("PROD_SUPABASE_URL") || Deno.env.get("SUPABASE_URL") || "";
const PROD_SERVICE_KEY = Deno.env.get("PROD_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
```

Then update all `createClient()` calls in `searchKnowledge`, `searchListings`, `searchProfiles`, `loadUserMemories`, and `extractAndSaveMemories` to use `PROD_SUPABASE_URL` and `PROD_SERVICE_KEY` instead of the current variables.

This ensures: edge function runs on Lovable Cloud (for auto-deployment), but all data comes from your production database.

**3. Fix `src/components/PWAInstallPrompt.tsx`** — Runtime error

Fix the `Cannot read properties of null (reading 'useState')` error caused by a React hooks import issue.

**4. Redeploy the edge function** to apply the new routing.

### What This Fixes
- AI concierge will query your real production data (listings, profiles, knowledge, memories)
- Memories saved by the AI will persist on your production database
- New knowledge or listings you add to production will immediately be available to the AI
- PWA install prompt crash eliminated

### Technical Note
The fallback chain (`PROD_SUPABASE_URL || SUPABASE_URL`) ensures the function still works if the production secrets haven't been set yet — it gracefully falls back to whatever is available.

