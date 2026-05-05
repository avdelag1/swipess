## Backend cleanup plan

You're fully connected to Supabase project `vplgtcguxujxwrgguxqq` — that's locked in correctly. But the backend has real gaps. Here's what I'll fix:

### 1. Create the missing `profile_views` table
The client dashboard fires `GET /profile_views?...` on every load and gets a 404 (`relation does not exist`). I'll create the table with proper columns (`user_id`, `viewed_profile_id`, `view_type`, `action`, `created_at`), RLS policies (users can only read/insert their own views), and an index on `(user_id, view_type)`.

### 2. Fix the empty `get_smart_listings` RPC
The function returns `[]` even when real listings exist in the database. Root cause: it filters on profile fields (city/age/budget) that are `null` for new users. I'll rewrite it to:
- Return all active listings when the client profile has no preferences yet
- Exclude only listings the user already swiped left on
- Order by recency + match score
- Always return real data first (per your "real listings before mock" rule)

### 3. Attach orphaned triggers
Three trigger functions exist but are not wired up. I'll attach them:
- `on_auth_user_created` → calls `handle_new_user()` after `auth.users` insert (auto-creates `profiles` + `user_roles` row)
- `messages_update_conversation_last_message` → updates conversation timestamp on new message
- `profiles_set_updated_at` + same on listings/conversations → keeps `updated_at` accurate

### 4. Add missing indexes for hot queries
From the network logs, these run constantly:
- `likes` filtered by `user_id + target_type` → add composite index
- `notifications` filtered by `user_id + is_read` → add composite index
- `conversations` with `client_id OR owner_id = X` → add indexes on both

### 5. Client-side query dedup
The `likes` and `notifications` queries fire 2–3× within seconds on dashboard load. I'll wrap them in TanStack Query with proper `staleTime: 30s` so React doesn't refetch on every render.

### 6. Run the Supabase linter
After migrations, I'll run `supabase--linter` to catch any RLS gaps, missing policies, or security warnings introduced — and fix them in the same pass.

### What I will NOT touch
- The locked Supabase project ref (`vplgtcguxujxwrgguxqq`) — stays as-is
- `src/integrations/supabase/client.ts` — auto-generated, never edit
- Auth flow, role architecture, profile schemas — already solid
- Visual design / dashboard layout — purely backend work

### Risk
Low. All migrations are additive (CREATE TABLE IF NOT EXISTS, CREATE TRIGGER, CREATE INDEX). The only function being modified is `get_smart_listings`, and the new version is strictly more permissive (returns more data, not less), so nothing currently working will break.

Approve and I'll execute all of this in one go.