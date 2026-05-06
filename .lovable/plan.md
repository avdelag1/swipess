## Problem

When you share a listing link, WhatsApp/Telegram/iMessage show the generic Swipess banner instead of the listing's actual photo.

Root cause: the `link-preview` edge function uses `Deno.env.get("SUPABASE_URL")` / `SUPABASE_ANON_KEY`, which on the deployed runtime point at the wrong backend (the function infra project), not the source-of-truth project `vplgtcguxujxwrgguxqq` where listings/profiles/events actually live. So every lookup returns no rows → fallback OG image is served.

I confirmed this by hitting the function directly: it returns the fallback image and never the listing's photo, even for valid IDs.

## Fix

### 1. Pin the data backend in `supabase/functions/link-preview/index.ts`
Replace the env-driven URL/key with hard-pinned constants for the source-of-truth project (matches `src/integrations/supabase/client.ts`):

```ts
const SUPABASE_URL = "https://vplgtcguxujxwrgguxqq.supabase.co";
const SUPABASE_ANON_KEY = "<anon key for vplgtcguxujxwrgguxqq>"; // already public
```

This guarantees the function reads listings, profile_images, and events from the correct DB regardless of where it's deployed.

### 2. Improve crawler-vs-browser handling
- Detect bots (WhatsApp, Telegram, facebookexternalhit, Twitterbot, Slackbot, Discord, LinkedIn, iMessage Preview) via `User-Agent` and serve the OG HTML *without* the JS/meta-refresh redirect (some crawlers follow redirects and lose context).
- Real browsers continue to get the instant redirect to `swipess.com/listing/:id`.

### 3. Strengthen image picking
- For listings: pick first non-empty entry from `images` array, fall back to `image_url`, then default OG.
- For profiles: query `profile_images` ordered by `position`, then fall back to `profiles.avatar_url`.
- Set `og:image:width=1200`, `height=630` (standard landscape preview ratio used by WhatsApp/FB), and add `og:image:alt`.

### 4. Redeploy and verify
- Deploy `link-preview`.
- Curl-test `/listing/<real-id>` and confirm `og:image` points at the listing's hero photo (not `og-image-nexus.png`).
- Curl-test `/profile/<real-user-id>` and confirm `og:image` points at the user's first photo.

After this, sharing any link to WhatsApp/Telegram/Facebook/iMessage will show the real photo of the listing or person.

## Files

- `supabase/functions/link-preview/index.ts` — pin SUPABASE_URL/KEY, add UA-based crawler detection, harden image fallbacks.