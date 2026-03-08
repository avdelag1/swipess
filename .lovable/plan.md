

# Full Audit: 5 Remaining Issues Found

## Issue 1: `support_tickets` Ghost Table (CRITICAL)

**File**: `src/components/SupportDialog.tsx`
**Impact**: Every support ticket submission crashes. The entire support system is non-functional.

The `support_tickets` table does not exist in the database. The dialog queries and inserts into it, and throws on error.

**Fix**: Create `support_tickets` table with columns: `id (uuid), user_id (uuid), subject (text), message (text), category (text default 'general'), priority (text default 'medium'), user_email (text), user_role (text), status (text default 'open'), created_at, updated_at`. RLS: users can insert and view own tickets.

---

## Issue 2: Missing Database Triggers (CRITICAL)

Three functions exist with NO triggers attached:

1. **`handle_new_user()`** — Should fire on `auth.users` INSERT to auto-create a `profiles` row and a `user_roles` row. Without this, new signups get no profile and no role, breaking the entire onboarding flow.

2. **`update_conversation_last_message_at()`** — Should fire AFTER INSERT on `conversation_messages` to update `conversations.last_message_at`. Without it, conversation ordering by latest message doesn't work.

3. **`update_updated_at_column()`** — Generic `updated_at` trigger, not attached to any table.

**Fix**: Create triggers:
- `on_auth_user_created` on `auth.users` AFTER INSERT → `handle_new_user()`
- `on_new_conversation_message` on `conversation_messages` AFTER INSERT → `update_conversation_last_message_at()`
- Attach `update_updated_at_column()` to key tables (profiles, conversations, digital_contracts, etc.)

---

## Issue 3: `radio_is_powered_on` Ghost Column

**File**: `src/contexts/RadioContext.tsx` line 216
**Impact**: Radio power state is never persisted. The update silently fails because `radio_is_powered_on` doesn't exist on `profiles`.

**Fix**: Add `radio_is_powered_on boolean DEFAULT true` column to `profiles` table.

---

## Issue 4: `availability_status` Ghost Column

**File**: `src/components/PropertyManagement.tsx` line 186
**Impact**: When toggling listing status, the update includes `availability_status` which doesn't exist. The `status` column IS updated correctly, but the ghost column causes a silent error or gets ignored depending on Supabase behavior.

**Fix**: Remove `availability_status: newStatus` from the update object — only keep `status: newStatus`.

---

## Issue 5: `view_count` Ghost Property Reference

**File**: `src/components/OwnerListingsStats.tsx` line 15
**Impact**: Total views stat always shows 0. The code reads `l.view_count` but the actual column is `views`.

**Fix**: Change `l.view_count` to `l.views`.

---

## Summary

| Issue | Type | Impact |
|-------|------|--------|
| `support_tickets` | Ghost table | Support system broken |
| Missing triggers | No triggers attached | New user onboarding broken, conversation ordering broken |
| `radio_is_powered_on` | Ghost column | Radio power state not persisted |
| `availability_status` | Ghost column | Silent error on listing status toggle |
| `view_count` | Wrong column name | Views stat always 0 |

## Implementation

### 1. Database Migration
- Create `support_tickets` table with RLS
- Add `radio_is_powered_on` column to `profiles`
- Create all 3 missing triggers

### 2. Code Fixes
- `PropertyManagement.tsx`: Remove `availability_status` from update
- `OwnerListingsStats.tsx`: `l.view_count` → `l.views`

