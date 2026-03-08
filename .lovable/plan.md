

# Continued Audit: 3 Remaining Issues Found

## Issue 1: `LikeNotificationPreview.tsx` — Two `id` vs `user_id` Mismatches (CRITICAL)

**File**: `src/components/LikeNotificationPreview.tsx` lines 66 and 88
**Bug**: Both profile queries use `.eq('id', likerId)` — `likerId` is a user UUID
**Impact**: City info never loads in the like notification preview card. Both the client and owner branches are broken.

**Fix**:
- Line 66: `.eq('id', likerId)` → `.eq('user_id', likerId)`
- Line 88: `.eq('id', likerId)` → `.eq('user_id', likerId)`

---

## Issue 2: `likes` Table Missing from Realtime Publication (CRITICAL)

The `NotificationSystem.tsx` subscribes to `postgres_changes` on the `likes` table (line 138), but `likes` is NOT in the `supabase_realtime` publication. Only `listings`, `conversations`, `messages`, `notifications`, and `conversation_messages` are published.

**Impact**: Owners NEVER receive real-time "New Flame" notifications when someone likes their listing. The entire like notification pipeline is dead.

**Fix**: DB migration to add `likes` to the realtime publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
```

---

## Issue 3: `on_auth_user_created` Trigger — Missing Profile Columns

The `handle_new_user()` function only inserts `user_id` into profiles:
```sql
INSERT INTO public.profiles (user_id) VALUES (NEW.id);
```

But it does NOT populate `email` from `NEW.email`. This means new user profiles always have `null` email until the user completes onboarding. Code that relies on `profiles.email` for pre-onboarding flows (like the support dialog which reads `user_email`) will show empty values.

**Fix**: Update `handle_new_user()` to also set `email`:
```sql
INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
```

---

## Summary

| Issue | Type | Impact |
|-------|------|--------|
| LikeNotificationPreview `id` vs `user_id` | Wrong column | City never shows in like previews |
| `likes` not in realtime | Missing publication | Like notifications never fire |
| `handle_new_user` missing email | Incomplete trigger | New profiles have null email |

## Implementation

### 1. DB Migration
- Add `likes` to `supabase_realtime` publication
- Update `handle_new_user()` to include email

### 2. Code Fix
- `LikeNotificationPreview.tsx`: Two `.eq('id', likerId)` → `.eq('user_id', likerId)`

