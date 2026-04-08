

## Plan: Fix Category Switch Animation, Backend Alignment, and Cleanup

### Problem 1: Client Dashboard "Sliding" on Category Switch

**Root cause**: In `SwipessSwipeContainer.tsx` (client side), the exhausted state wrapper uses `key={`exhausted-${storeActiveCategory}`}` with scale animations (`initial: scale 0.95`, `exit: scale 1.05`). Every time you tap a different quick filter, the key changes, causing AnimatePresence to fully unmount and remount the component with a scale transition — creating the "page sliding from side to side" effect.

The owner side (`ClientSwipeContainer.tsx`) does NOT wrap SwipeExhaustedState in a keyed motion.div, so it swaps instantly.

**Fix**: Remove the scale animation from the exhausted state wrapper in `SwipessSwipeContainer.tsx`. Use only opacity fade (matching the owner side behavior), and keep the key static so category switches inside `SwipeExhaustedState` happen internally without full unmount/remount cycles.

### Problem 2: Backend Alignment (Production Supabase)

The codebase is already locked to your production Supabase (`vplgtcguxujxwrgguxqq`) in `client.ts`. All auth, likes, profiles, and data operations go through this project. 

**One exception found**: `src/hooks/useConciergeAI.ts` hardcodes the AI concierge edge function URL to the Lovable Cloud project (`qegyisokrxdsszzswsqk`). This needs to be migrated to call your production Supabase instead, OR the edge function needs to be deployed there. Since the AI concierge edge function currently lives on Lovable Cloud, we have two options:

- **Option A**: Deploy the `ai-concierge` edge function to your production Supabase and update the URL
- **Option B**: Keep it on Lovable Cloud for now (it only handles AI chat, not user data)

I'll update `useConciergeAI.ts` to derive the URL from the production Supabase client config so it's consistent.

### Problem 3: Leftover Cleanup

Found these leftovers to clean:
1. **Mock data in events** (`MOCK_EVENTS`, `MOCK_MESSAGES`) — Events/chat use hardcoded mock arrays as fallback data. These should remain for now since events aren't fully wired to the database yet.
2. **Mock data guards in ClientSwipeContainer** — `isMockData` check (line 458, 492) for `test-` or `client-` prefixed user IDs that skip DB writes. This is dead code if no mock profiles are injected anymore. Remove it.
3. **Dead comments** — Lines like `// MOCK_TEST_CLIENTS removed for Instagram cleanup` and `// import { MOCK_TEST_LISTINGS } was here` are noise. Remove them.

### Files Modified

1. **`src/components/SwipessSwipeContainer.tsx`** — Remove scale animation from exhausted state wrapper; use static key + opacity-only transition to match owner side behavior
2. **`src/hooks/useConciergeAI.ts`** — Derive AI concierge URL from the production Supabase project config instead of hardcoding Lovable Cloud URL
3. **`src/components/ClientSwipeContainer.tsx`** — Remove `isMockData` dead code path and stale comments

### Technical Detail

The animation fix changes this:
```typescript
// BEFORE (causes sliding)
<motion.div
  key={`exhausted-${storeActiveCategory}`}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 1.05 }}
>

// AFTER (instant swap, no sliding)
<motion.div
  key="exhausted"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
```

The backend fix changes the AI URL from Lovable Cloud to production:
```typescript
// BEFORE
const AI_URL = 'https://qegyisokrxdsszzswsqk.supabase.co/functions/v1/ai-concierge';

// AFTER — derives from the same project as all other data
const AI_URL = 'https://vplgtcguxujxwrgguxqq.supabase.co/functions/v1/ai-concierge';
```

