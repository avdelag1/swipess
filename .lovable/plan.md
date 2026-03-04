

## Plan: Restore .env to Fix Splash Screen Crash

### Root Cause
The `.env` file does not exist. The Supabase client (`src/integrations/supabase/client.ts`) throws `"Missing Supabase environment variables"` on import, crashing the app before React can mount. The splash screen loader in `index.html` is never removed because `src/main.tsx` never executes past the crash.

### Fix
Recreate `.env` with the known project credentials:

```
VITE_SUPABASE_PROJECT_ID="qegyisokrxdsszzswsqk"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ3lpc29rcnhkc3N6enN3c3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjY0NTIsImV4cCI6MjA4NTg0MjQ1Mn0.4tdJ82fDnFXaJ6SHpfveCiGxGm2S4II6NNIbGUnT2ZU"
VITE_SUPABASE_URL="https://qegyisokrxdsszzswsqk.supabase.co"
```

This is a single-file fix. No other changes needed — the app will boot once these variables are available.

