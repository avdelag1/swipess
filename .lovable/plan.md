

# Fix Build Errors + AI Chat

## Problem Summary
There are 4 build errors preventing the app from compiling, plus the AI chat is silently failing because it bypasses the Supabase client and uses hardcoded credentials from the wrong project.

## Build Fixes

### 1. `SwipeExhaustedState.tsx` — 3 errors
- **Line 3**: `UserGroup` doesn't exist in lucide-react. Remove it (it's not used in the JSX).
- **Line 54**: `triggerHaptic` is not imported. Add `import { triggerHaptic } from '@/utils/haptics';`
- **Line 96**: `isError` doesn't exist on one branch of the return type union. Use optional chaining: `const isError = getEmptyMessage().isError ?? false;` or restructure to always include `isError`.

### 2. `SwipessSwipeContainer.tsx` — 1 error
- **Line 1123**: `userRole` is referenced but never declared. Import `useUserRole` from `@/hooks/useUserRole` and call it with `user?.id` to get the role value. Add near the other hooks (around line 133):
  ```ts
  const { data: userRole } = useUserRole(user?.id);
  ```

## AI Chat Fix (Critical)

**Root cause**: `useConciergeAI.ts` (lines 164-167) bypasses the Supabase client and makes a raw `fetch()` call with:
- A fallback URL pointing to the **old** Supabase project (`vplgtcguxujxwrgguxqq`)
- A hardcoded anon key for that old project

The edge functions are deployed on the **current** Lovable Cloud project (`qegyisokrxdsszzswsqk`), so the credentials mismatch causes auth failure.

**Fix**: Replace the raw `fetch()` with `supabase.functions.invoke()` which automatically uses the correct URL and key. For streaming support, construct the URL from `import.meta.env.VITE_SUPABASE_URL` and use the env-based anon key (`import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`), removing all hardcoded old credentials.

Specifically in `useConciergeAI.ts`:
- **Line 164**: Remove the hardcoded fallback URL to the old project
- **Line 167**: Remove the hardcoded `targetAnonKey` constant
- Replace with env-based values:
  ```ts
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const functionUrl = `${supabaseUrl}/functions/v1/ai-orchestrator`;
  ```
- Update the `fetch` headers to use `anonKey` instead of `targetAnonKey`

I confirmed the orchestrator is working (ping returns `ready`, chat returns valid responses). The only issue is the client sending the wrong credentials.

## Files to Edit

| File | Change |
|------|--------|
| `src/components/swipe/SwipeExhaustedState.tsx` | Remove `UserGroup` import, add `triggerHaptic` import, fix `isError` type |
| `src/components/SwipessSwipeContainer.tsx` | Add `useUserRole` hook call |
| `src/hooks/useConciergeAI.ts` | Remove hardcoded old-project credentials, use env vars |

## Verification
After fixes, the app should compile and the AI chat should respond when messages are sent.

