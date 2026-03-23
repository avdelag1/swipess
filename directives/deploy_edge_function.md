# Deploy Edge Function

## Overview
Supabase Edge Functions are Deno-based serverless functions in `/supabase/functions/`. Each function has its own directory with an `index.ts` entry point.

## Available Functions

| Function | Purpose |
|----------|---------|
| `ai-conversation` | AI-powered chat within a match |
| `ai-assistant` | General AI assistance for users |
| `ai-orchestrator` | Routes AI requests to the right model/context |
| `delete-user` | Permanently deletes a user account and all data |
| `moderate-image` | Image content moderation before upload |
| `send-push-notification` | VAPID Web Push to user devices |

## Tools
- `supabase functions deploy <name>` — deploy a single function
- `supabase functions serve <name>` — serve locally for testing
- `supabase functions list` — list deployed functions

## Deploying a Function

```bash
# Deploy single function
supabase functions deploy delete-user

# Deploy all functions
supabase functions deploy

# Deploy with no-verify-jwt for public endpoints
supabase functions deploy my-function --no-verify-jwt
```

## Creating a New Function

```bash
# Scaffold new function
supabase functions new my-function-name
```

This creates `/supabase/functions/my-function-name/index.ts` with a Deno boilerplate.

## Function Template

```typescript
/* eslint-disable no-console */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { someParam } = await req.json();

    // ... function logic ...

    return new Response(
      JSON.stringify({ result: "success" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## Environment Variables

Secrets are set via Supabase dashboard or CLI:

```bash
supabase secrets set MY_SECRET=value
supabase secrets list
```

Access in function: `Deno.env.get("MY_SECRET")`

## Local Testing

```bash
# Start local Supabase
supabase start

# Serve function locally (hot-reload)
supabase functions serve ai-conversation --env-file .env

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-conversation \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## Common Errors

**`FunctionsFetchError: Failed to send request`** → Function not deployed or URL wrong

**`403 Forbidden`** → JWT verification required; pass a valid user token in `Authorization` header

**`Worker exceeded memory limit`** → Reduce payload size or optimize processing; Deno workers have ~512MB limit

**CORS errors in browser** → Ensure all response paths include `corsHeaders` and OPTIONS is handled

**`import error` for Deno modules** → Use exact version pins in import URLs (e.g., `deno.land/std@0.168.0`)
