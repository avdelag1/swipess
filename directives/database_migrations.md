# Database Migrations

## Overview
All schema changes are managed through Supabase migrations in `/supabase/migrations/`. Files are applied in chronological order based on filename prefix.

## Tools
- `supabase db push` — applies pending migrations to remote Supabase project
- `supabase db diff` — generates a migration from schema changes
- `supabase db reset` — drops and re-applies all migrations locally (destructive)

## Creating a New Migration

**Naming convention:** `YYYYMMDDHHMMSS_short_description.sql`

```bash
# Generate from schema diff (recommended)
supabase db diff -f short_description

# Or create manually
touch supabase/migrations/$(date +%Y%m%d000000)_short_description.sql
```

## Migration Structure Template

```sql
-- ============================================================
-- DESCRIPTION: What this migration does and why
-- AFFECTED TABLES: table1, table2
-- ============================================================

-- Schema changes here
ALTER TABLE public.table_name ADD COLUMN ...;

-- RLS policies (always enable RLS when adding a new table)
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "descriptive policy name" ON public.new_table;
CREATE POLICY "descriptive policy name"
    ON public.new_table FOR SELECT
    USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema (always include at end)
NOTIFY pgrst, 'reload schema';
```

## RLS Policy Checklist

Every table must have policies for all 4 operations (SELECT, INSERT, UPDATE, DELETE) unless one is intentionally blocked.

- **SELECT**: Who can read rows? Usually `auth.uid() = user_id` or `true` for public data
- **INSERT**: Who can create rows? Usually `auth.uid() = user_id` (prevents spoofing)
- **UPDATE**: Who can modify rows? Usually `auth.uid() = user_id` (both USING and WITH CHECK)
- **DELETE**: Who can remove rows? Usually `auth.uid() = user_id`

**Trigger exception:** Postgres triggers with `SECURITY DEFINER` bypass RLS. The `tr_handle_mutual_like` trigger uses this to create matches without the calling user needing INSERT on the matches table directly.

## Applying Migrations

```bash
# Apply to remote (production)
supabase db push

# Check status
supabase db status

# Verify locally first
supabase start
supabase db reset
```

## Active Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `profiles` | User profiles (public view) | SELECT: true, others: own |
| `listings` | Property/service listings | SELECT: active only, others: own |
| `likes` | Swipe records | All: own via `user_id` |
| `matches` | Mutual match records | All: participants only |
| `conversations` | Chat threads | All: participants only |
| `client_profiles` | Extended client data | Own only |

## Common Errors

**`ERROR: policy already exists`** → Use `DROP POLICY IF EXISTS` before `CREATE POLICY`

**`ERROR: relation does not exist`** → Check migration order; the table migration must run before the RLS migration

**RLS blocking triggers** → Use `SECURITY DEFINER` on the trigger function, or use `SECURITY INVOKER` with explicit grants

**PostgREST not seeing changes** → Always end migrations with `NOTIFY pgrst, 'reload schema';`
