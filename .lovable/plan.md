

# Fix: AI Chat Hitting Wrong Backend on Production

## Problem

The `getBackendConfig()` function in `useConciergeAI.ts` (line 44) reads `import.meta.env.VITE_SUPABASE_URL` **first**, before falling back to the Supabase client's URL. The `.env` file contains the Lovable Cloud URL (`qegyisokrxdsszzswsqk`). When Vite builds the app, this env var gets baked into the bundle — so on production (www.swipess.com), the AI orchestrator calls are sent to the **Lovable Cloud** edge function instead of your real backend. That's the 401 error in your console screenshot.

The `client.ts` was correctly hardcoded to your production project, but `getBackendConfig()` bypasses it by reading the env var directly.

## Fix (1 file, ~5 lines)

**`src/hooks/useConciergeAI.ts`** — Change `getBackendConfig()` to derive URL and key from the Supabase client instance only, never from `import.meta.env`:

```typescript
function getBackendConfig() {
  const clientUrl = (supabase as any)?.supabaseUrl as string | undefined;
  const clientKey = (supabase as any)?.supabaseKey as string | undefined;

  return {
    url: clientUrl || '',
    anonKey: clientKey || '',
  };
}
```

This ensures the AI orchestrator URL always matches whatever `client.ts` is configured to use (which is hardcoded to `vplgtcguxujxwrgguxqq`). No more env var override hijacking it to Lovable Cloud.

## What This Fixes

- Production AI chat will call `vplgtcguxujxwrgguxqq.supabase.co/functions/v1/ai-orchestrator` (your MiniMax-powered function)
- No more 401 errors from hitting the wrong backend
- Lovable preview will also work since `client.ts` points to production there too

## What I Will NOT Touch

- The AI orchestrator edge function code
- Any backend tables or configuration
- The `client.ts` file

