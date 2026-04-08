

## Plan: Upgrade AI Concierge — Real-Time Awareness, Profile Search, and App Navigation

### Problem

1. **No time/date awareness**: The AI doesn't know the current date or time, giving wrong answers ("May 2025" instead of April 2026).
2. **No profile search**: The AI can search listings but has zero ability to query user profiles — it can't answer "show me people looking for apartments."
3. **No in-app navigation**: The AI talks about "tap here" but can't actually trigger navigation to Settings, Radio, Filters, etc.
4. **No access gating**: The AI is free for everyone. The plan is to gate it behind premium subscriptions/tokens, but no infrastructure exists for that yet.

### Changes

**1. Inject real-time context into system prompt** (edge function)

Add the current UTC date/time and Tulum local time (UTC-5) directly into the system prompt so every response is time-aware.

```
## Current Time
UTC: 2026-04-08T13:45:00Z
Tulum (CST): Tuesday, April 8, 2026 — 8:45 AM
```

This is a 3-line addition to `buildSystemPrompt()`.

**2. Add profile search capability** (edge function)

Create a `searchProfiles()` function that queries `profiles` + `client_profiles` tables for:
- Name, nationality, age, languages, active mode
- What they're looking for (from `client_filter_preferences`)
- Never expose emails, phone numbers, or private data

Return results as anonymized summaries with deep links: `"👤 **Maria, 28** — Looking for 2-bed in Aldea Zama → [View Profile](/profile/xyz)`

Wire it into the main handler alongside listing search — detect profile-intent queries ("find users looking for...", "show me people who...", "who wants...").

**3. Add app navigation actions** (edge function + frontend)

Teach the AI to emit special action markers in its responses that the frontend can detect and render as tappable buttons:

Edge function side — add to system prompt:
```
When suggesting the user navigate somewhere in the app, include an action tag:
[NAV:/client/filters] for filters
[NAV:/radio] for radio
[NAV:/client/profile] for profile/settings
[NAV:/subscription/packages] for packages
```

Frontend side — in `ConciergeChat.tsx`, parse `[NAV:...]` tags from AI responses and render them as tappable navigation buttons that call `navigate()`.

**4. Add premium access gating** (frontend hook)

Create a check in `useConciergeAI.ts` that verifies the user has an active subscription or remaining tokens before allowing AI interaction. Free users see a prompt to upgrade. This uses the existing `useCanAccessMessaging()` / `useUserSubscription()` hooks.

### Files to Modify

1. **`supabase/functions/ai-concierge/index.ts`**
   - Add `getCurrentTimeContext()` helper → inject into all system prompts
   - Add `detectProfileIntent()` + `searchProfiles()` functions
   - Add navigation action instructions to system prompt
   - Wire profile search into the parallel context-gathering block

2. **`src/components/ConciergeChat.tsx`**
   - Parse `[NAV:/path]` markers in AI messages → render as tappable buttons
   - Add premium gate check before sending messages

3. **`src/hooks/useConciergeAI.ts`**
   - Add `isPremiumRequired` / `canUseAI` state based on subscription status
   - Block `sendMessage` for non-premium users with upgrade prompt

### Security Notes

- Profile search uses service role key (server-side only) — no private data leaks to client
- Only public-safe fields returned: name, nationality, age, what they're looking for
- No emails, phone numbers, or auth data exposed
- Navigation actions are client-side only — the AI suggests paths, the frontend validates them

### What This Does NOT Change

- Persona system (Kyle, Beau Gosse, etc.) — untouched
- Streaming architecture — untouched
- Memory extraction — untouched
- Knowledge base search — untouched

