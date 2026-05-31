# Database Schema Verification Guide

## Current Issue

Queries in the application reference columns that **may not exist** in the live Supabase database, causing:
- 400 Bad Request errors on listings fetch
- Messages disappearing on page refresh
- Chat interface failures

## Verified Column Names (From Code Analysis)

### `listings` Table

**✅ CORRECT columns to use:**
```
id, title, price, category, 
bedrooms, bathrooms, beds, baths,
images, image_url,
neighborhood, city, address,
currency, listing_type, owner_id,
status, is_active,
created_at, updated_at
```

**❌ INVALID columns (DO NOT USE):**
- `user_id` ← Use `owner_id` instead
- `location` ← Use `neighborhood` or `city` instead
- `amenities` ← May be JSON, verify first

**Where these appear:**
- ✅ `supabase/functions/ai-concierge/index.ts:321` - CORRECT columns
- ❌ `src/hooks/useListings.tsx:180` - Uses `.select(SWIPE_CARD_FIELDS)` - VERIFY SWIPE_CARD_FIELDS
- ❌ `src/integrations/supabase/types.ts` - TypeScript types (may be outdated)

---

### `conversation_messages` Table

**✅ CORRECT columns to use:**
```
id, conversation_id, sender_id,
content, message_type,
is_read, read_at,
created_at
```

**⚠️ CONDITIONAL columns (check existence first):**
- `message_text` - Alias for `content` (may not exist in live DB)
- `attachments` - JSONB field (verify existence)

**Where these appear:**
- ✅ `src/hooks/useConversations.tsx:349` - Selects correct columns
- ⚠️ Recent commits mention dropping these queries

---

### `conversations` Table

**✅ CORRECT columns to use:**
```
id,
match_id,
client_id, owner_id,
listing_id,
status, is_active,
last_message_at,
created_at, updated_at
```

**⚠️ Legacy columns (deprecated):**
- `participant_1_id`, `participant_2_id` ← Use `client_id`, `owner_id` instead

---

## How to Verify

### Option 1: Supabase Dashboard

1. Log into [Supabase Console](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Run:
   ```sql
   -- Check listings columns
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'listings'
   ORDER BY ordinal_position;
   
   -- Check conversation_messages columns
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'conversation_messages'
   ORDER BY ordinal_position;
   
   -- Check conversations columns
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'conversations'
   ORDER BY ordinal_position;
   ```
5. Compare output against **CORRECT columns** section above

### Option 2: From Your Terminal

```bash
# Using Node.js with Supabase client
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
(async () => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .limit(1);
  if (error) console.error('Error:', error);
  else console.log('Columns:', data[0] ? Object.keys(data[0]) : 'No data');
})();
"
```

### Option 3: Run Migration Check

```bash
node scripts/debug_listings.ts
```

This script (already in repo) will show you what columns exist.

---

## Migration Status

These migrations should have been applied:

| Migration File | Purpose | Status |
|---|---|---|
| `20260514120000_fix_messaging_triggers.sql` | Add `content` column to `conversation_messages` | ⚠️ Check |
| `20260514200000_fix_rls_and_conversation_function.sql` | Fix RLS & participant check function | ⚠️ Check |
| `20260514230000_messaging_infrastructure_recovery.sql` | Harden all columns & RLS policies | ⚠️ Check |
| `20260213021741_*.sql` | Add `client_id`, `owner_id` to conversations | ⚠️ Check |

**To verify applied migrations:**

```sql
-- In Supabase SQL Editor:
SELECT * FROM _realtime.schema_migrations 
ORDER BY executed_at DESC LIMIT 10;
```

If migrations are **NOT applied**, apply them manually:

1. Go to Supabase SQL Editor
2. Copy migration content from `supabase/migrations/*.sql`
3. Paste and run
4. Verify columns exist

---

## Quick Checklist

Before deploying:

- [ ] Verify `listings` table has `owner_id` (not `user_id`)
- [ ] Verify `listings` table has `city` & `neighborhood` (not `location`)
- [ ] Verify `conversation_messages` table has `content` column
- [ ] Verify `conversations` table has `client_id` & `owner_id` columns
- [ ] Run all migrations in Supabase
- [ ] Test listings fetch: `npm run test`
- [ ] Test chat fetch: Navigate to chat page
- [ ] Check browser console for 400 errors

---

## Reference: Correct Query Examples

### ✅ Correct Listings Query

```typescript
const { data: listings } = await supabase
  .from('listings')
  .select('id, title, price, category, bedrooms, bathrooms, images, neighborhood, city, currency, listing_type, owner_id, created_at, status')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(30);
```

### ✅ Correct Messages Query

```typescript
const { data: messages } = await supabase
  .from('conversation_messages')
  .select('id, conversation_id, sender_id, content, message_type, is_read, read_at, created_at')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

### ❌ Incorrect (Will Fail)

```typescript
// DON'T do this:
const { data: listings } = await supabase
  .from('listings')
  .select('id, title, user_id, location, ...')  // user_id & location don't exist!
```

---

**Last Verified:** 2026-05-31  
**Status:** Ready for verification
