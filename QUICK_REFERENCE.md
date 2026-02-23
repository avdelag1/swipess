# 🚀 Quick Reference Guide - Swipess Database

## 📂 What You Have

### 1. **DATABASE_SCHEMA_DESIGN.md**
- **Purpose**: Complete documentation of your database design
- **Use for**: Understanding the structure, relationships, and design decisions
- **Read this**: To understand WHY things are organized this way

### 2. **CLEAN_DATABASE_SCHEMA.sql**
- **Purpose**: Ready-to-run SQL file to rebuild your entire database
- **Use for**: Sending to Supabase AI, running in SQL Editor, or starting fresh
- **Run this**: To create a clean database from scratch

### 3. **diagnose_missing_users.sql**
- **Purpose**: Diagnostic queries to find orphaned user records
- **Use for**: Debugging the current issue with missing users
- **Run this**: Before applying fixes to see what's wrong

### 4. **supabase/migrations/20260215180300_fix_orphaned_user_profiles.sql**
- **Purpose**: Migration to fix orphaned user records
- **Use for**: Cleaning up existing database issues
- **Run this**: To fix the current problem

---

## 🎯 What to Do Next

### Option 1: Fix Your Current Database (Recommended)

1. **Diagnose the problem:**
   ```bash
   # Open Supabase Dashboard → SQL Editor
   # Copy/paste content from diagnose_missing_users.sql
   # Run it to see what's broken
   ```

2. **Apply the fix:**
   ```bash
   # Option A: Use Supabase CLI
   supabase db push

   # Option B: Manual in SQL Editor
   # Copy/paste content from:
   # supabase/migrations/20260215180300_fix_orphaned_user_profiles.sql
   ```

3. **Verify it worked:**
   - Check auth.users count matches profiles count
   - All users should now appear correctly

---

### Option 2: Rebuild Database From Scratch (If needed)

⚠️ **WARNING**: This will delete all existing data!

1. **Backup your data first!**
   ```bash
   # Export from Supabase Dashboard
   ```

2. **Send to Supabase AI:**
   - Open Supabase AI Assistant
   - Upload `CLEAN_DATABASE_SCHEMA.sql`
   - Ask: "Please review and apply this schema. Check for any issues or optimizations."

3. **Or run manually:**
   ```bash
   # Copy entire content of CLEAN_DATABASE_SCHEMA.sql
   # Paste in Supabase SQL Editor
   # Run it (takes 1-2 minutes)
   ```

---

## 📊 Database Organization Summary

### Core Tables (18 total):
```
AUTHENTICATION & USERS (5 tables):
├── auth.users (Supabase managed)
├── profiles (main user data)
├── user_roles (client/owner/admin)
├── client_profiles (client-specific)
└── owner_profiles (owner-specific)

CONTENT (1 table):
└── listings (all properties/services/vehicles)

MATCHING (2 tables):
├── likes (swipes)
└── matches (mutual likes)

MESSAGING (2 tables):
├── conversations (chat threads)
└── conversation_messages (individual messages)

MONETIZATION (3 tables):
├── subscription_packages (available plans)
├── user_subscriptions (purchased subscriptions)
└── tokens (message credits)

OTHER (5 tables):
├── digital_contracts (rental agreements)
├── reviews (ratings & reviews)
├── notifications (in-app notifications)
├── saved_filters (search preferences)
└── user_visual_preferences (UI settings)

ADMIN (3 tables):
├── admin_audit_log (admin actions)
├── platform_analytics (metrics)
└── user_reports (user-generated reports)
```

---

## 🔑 Key Features Built-In

### ✅ Security:
- Row Level Security (RLS) on ALL tables
- Foreign key constraints prevent orphaned records
- CASCADE deletion for user data cleanup
- Admin-only access to sensitive tables

### ✅ Performance:
- 35+ strategic indexes
- Optimized for common queries
- Composite indexes for multi-column searches

### ✅ Real-time:
- Enabled for: notifications, messages, matches
- Live updates without page refresh

### ✅ Data Integrity:
- Automatic timestamp updates
- Auto-profile creation on signup
- Constraint checks on all critical fields

### ✅ Admin Dashboard Ready:
- 3 pre-built views for common admin queries
- Audit logging for compliance
- Analytics aggregation table

---

## 🔐 User Roles Explained

| Role | Can Do | Cannot Do |
|------|---------|-----------|
| **Client** | Browse listings, swipe, match, message, book services | Create listings, access admin features |
| **Owner** | Create listings, receive matches, message clients | Access admin features, modify other users |
| **Admin** | View all data, ban users, review reports, see analytics | Modify user data (only flag/ban) |

---

## 💡 Common Queries

### Get all users with their roles:
```sql
SELECT p.full_name, p.email, ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;
```

### Get all active listings in a city:
```sql
SELECT * FROM listings
WHERE is_active = true AND city = 'Mexico City'
ORDER BY created_at DESC;
```

### Get user's token balance:
```sql
SELECT SUM(remaining_activations) as total_tokens
FROM tokens
WHERE user_id = 'YOUR_USER_ID'
AND (expires_at IS NULL OR expires_at > NOW());
```

### Get match statistics for a user:
```sql
SELECT
  COUNT(*) as total_matches,
  COUNT(CASE WHEN matched_at > NOW() - INTERVAL '7 days' THEN 1 END) as matches_this_week
FROM matches
WHERE user_id_1 = 'YOUR_USER_ID' OR user_id_2 = 'YOUR_USER_ID';
```

---

## 🆘 Troubleshooting

### Problem: "Users appear in app but not in Supabase Auth"
**Solution**: Run `diagnose_missing_users.sql`, then apply the fix migration

### Problem: "Permission denied when inserting profile"
**Solution**: Check RLS policies, ensure user is authenticated

### Problem: "Can't create listing"
**Solution**: Verify user has 'owner' role in user_roles table

### Problem: "Tokens not working"
**Solution**: Check expires_at date, ensure remaining_activations > 0

---

## 📱 App Access Patterns

### Main App (Client/Owner):
```typescript
// ✅ They CAN:
- View own profile
- View all active listings
- Create/view matches
- Send/receive messages
- Purchase subscriptions
- Create reviews

// ❌ They CANNOT:
- View other users' private data
- Access admin tables
- Modify listings they don't own
- See deleted/archived content
```

### Admin Dashboard:
```typescript
// ✅ They CAN:
- View all users (vw_admin_user_summary)
- View all listings (vw_admin_listing_summary)
- View revenue (vw_admin_revenue_summary)
- Review reports
- View audit logs
- Ban users (set is_active = false)
- Remove listings

// ❌ They CANNOT:
- Modify user profiles (except is_active flag)
- Send messages as other users
- Create fake matches
```

---

## 🎨 For Your AI Assistant

When asking Supabase AI to help, provide this context:

```
I have a dual-app system:
1. Main app with Clients (seekers) and Owners (providers) - swipe-based matching
2. Admin dashboard for platform monitoring

Requirements:
- Clients swipe on listings/profiles, match with owners
- Owners create listings (rentals, services, vehicles)
- Pay-per-use messaging (token-based)
- Subscription packages for both roles
- Admin monitoring with audit logs

Please review CLEAN_DATABASE_SCHEMA.sql for the complete structure.
```

---

## 📈 Next Steps Checklist

- [ ] Run diagnostic script (diagnose_missing_users.sql)
- [ ] Apply fix migration if needed
- [ ] Review DATABASE_SCHEMA_DESIGN.md
- [ ] Consider if you need any additional tables (favorites, multi-language, etc.)
- [ ] Test RLS policies with different user roles
- [ ] Seed test data (users, listings, matches)
- [ ] Build admin dashboard using the provided views
- [ ] Set up automated analytics aggregation
- [ ] Configure realtime subscriptions in frontend
- [ ] Set up database backups

---

## 🔗 Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `DATABASE_SCHEMA_DESIGN.md` | Full documentation | Understanding structure |
| `CLEAN_DATABASE_SCHEMA.sql` | Complete SQL schema | Fresh database setup |
| `diagnose_missing_users.sql` | Diagnostic queries | Finding issues |
| `supabase/migrations/20260215180300_fix_orphaned_user_profiles.sql` | Fix migration | Cleaning up orphans |
| `QUICK_REFERENCE.md` | This file! | Quick lookups |

---

**Need help?** Review the documentation files or ask specific questions about:
- Table relationships
- RLS policies
- Index optimization
- Admin dashboard queries
- Migration strategy
