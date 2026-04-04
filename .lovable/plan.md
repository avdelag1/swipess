

# Fix 3 Critical Issues: AI Concierge, Splash Logos, Radio

## Problem Summary

1. **AI Concierge broken**: The `ConciergeChat` component (via `useConciergeAI.ts`) tries to read/write to 3 database tables that don't exist: `user_memories`, `ai_conversations`, `ai_messages`. The edge function `ai-orchestrator` also queries `user_memories`. Every interaction crashes silently.

2. **Three different splash logos**: During app load, the user sees up to 3 sequential logos with different fonts/sizes/animations:
   - `index.html` splash: `system-ui` font at `4.5rem` with CSS `heartbeat` keyframes
   - `PremiumLoader` (React fallback): `SwipessLogo` component with Tailwind `font-black` at `text-5xl` with framer-motion `scale` breathing
   - These use different font families and different animation styles, creating a jarring "3 different logos" effect

3. **Radio inaccessible**: The radio page uses `fixed inset-0 z-50`, but its parent `app-root` div has `overflow-hidden` which creates a containing block that traps fixed-position children on some browsers/devices.

---

## Fix 1: Create Missing AI Tables

Create a database migration with 3 tables:

**`ai_conversations`**: `id` (uuid PK), `user_id` (uuid, references auth.users), `title` (text), `is_archived` (boolean default false), `created_at`, `updated_at`

**`ai_messages`**: `id` (uuid PK), `conversation_id` (uuid FK → ai_conversations), `user_id` (uuid), `role` (text), `content` (text), `metadata` (jsonb default '{}'), `created_at`

**`user_memories`**: `id` (uuid PK), `user_id` (uuid), `category` (text default 'note'), `title` (text), `content` (text), `tags` (text[]), `source` (text), `created_at`, `updated_at`

All with RLS policies allowing users to CRUD their own rows only. Enable realtime on `ai_messages`.

**Also fix `ai-orchestrator` edge function**: Add a try-catch around the `user_memories` query so it gracefully returns empty if the table query fails (defensive).

---

## Fix 2: Single Splash Logo

**Goal**: One logo, one font, one animation, from first paint to React mount.

**`index.html`**: Change the splash wordmark font to match the React `SwipessLogo` exactly:
- Use the same `font-weight: 900` (already matches)
- Match the React component's text size: change from `4.5rem` to `3rem` (matching the `text-5xl` / `2xl` SwipessLogo used in PremiumLoader)
- Keep the CSS `heartbeat` animation (scale 1→1.03→1) since it matches the framer-motion breathing

**`src/components/ui/suspense-fallback.tsx`**: Change the fallback to return `null` instead of `PremiumLoader`. The `index.html` splash already covers the loading state. Showing a second React-rendered logo creates the duplicate. The splash dissolves via the `app-rendered` event, so there's no gap.

This eliminates logo #2 entirely. The user sees one splash (index.html) which dissolves cleanly into the app.

---

## Fix 3: Radio Page Accessibility

**`src/components/DashboardLayout.tsx` line 470**: The `app-root` div has `overflow-hidden` which traps `position: fixed` children when combined with transforms or `will-change` on ancestor elements.

Fix: Remove `overflow-hidden` from the `app-root` div. Replace with `overflow-x-hidden` (still prevents horizontal overflow from wide content) but allows fixed-position children to escape to the viewport.

Additionally, verify the `<main>` for fullscreen routes already uses `overflow-visible` (confirmed from line 509).

---

## Files to Modify

| File | Change |
|------|--------|
| **Database migration** | Create `ai_conversations`, `ai_messages`, `user_memories` tables with RLS |
| `supabase/functions/ai-orchestrator/index.ts` | Wrap `user_memories` query in try-catch |
| `index.html` | Reduce splash wordmark size to `3rem` to match React logo |
| `src/components/ui/suspense-fallback.tsx` | Return `null` for the generic fallback (no second logo) |
| `src/components/DashboardLayout.tsx` | Change `app-root` from `overflow-hidden` to `overflow-x-hidden` |

