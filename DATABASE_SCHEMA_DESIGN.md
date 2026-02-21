# 📊 Swipess Database Schema - Complete Design

## 🎯 Overview
This database supports a **dual-app ecosystem**:
1. **Main App** - Clients (seekers) and Owners (providers) with swipe-based matching
2. **Admin Dashboard** - Administrators monitoring all activities

---

## 👥 User Roles System

### Three Role Types:
- **`client`** - People seeking services/rentals (swipe to find)
- **`owner`** - Service providers/property owners (create listings)
- **`admin`** - Platform administrators (separate dashboard)

---

## 📋 Table Organization

### 🔐 1. AUTHENTICATION & USER MANAGEMENT

#### `auth.users` (Supabase managed)
- Managed by Supabase Auth
- Contains email, encrypted password, OAuth data
- **DO NOT directly manipulate this table**

#### `profiles` (Main user profiles)
```
Purpose: Core user profile data (1:1 with auth.users)
Columns:
- id (uuid, PK, FK → auth.users.id)
- full_name (text)
- email (text)
- phone (text)
- avatar_url (text)
- age (integer)
- gender (text)
- bio (text)
- country (text)
- city (text)
- neighborhood (text)
- nationality (text)
- languages_spoken (jsonb array)
- images (jsonb array)
- interests (jsonb array)
- lifestyle_tags (jsonb array)
- work_schedule (text)
- smoking (boolean)
- onboarding_completed (boolean)
- is_active (boolean)
- last_seen_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- idx_profiles_city (city)
- idx_profiles_country (country)
- idx_profiles_onboarding (onboarding_completed)

Trigger: Auto-created when auth.users is created
```

#### `user_roles` (Role assignments)
```
Purpose: Maps users to their role (client/owner/admin)
Columns:
- id (bigserial, PK)
- user_id (uuid, UNIQUE, FK → auth.users.id)
- role (app_role enum: 'client' | 'owner' | 'admin')
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- UNIQUE(user_id) - One role per user
- FK to auth.users ON DELETE CASCADE

RLS:
- Users can view their own role
- Admins can view all roles
```

#### `client_profiles` (Client-specific data)
```
Purpose: Extended profile for clients (seekers)
Columns:
- id (bigserial, PK)
- user_id (uuid, UNIQUE, FK → auth.users.id)
- name (text)
- age (integer)
- bio (text)
- gender (text)
- profile_images (jsonb array)
- interests (jsonb array)
- preferred_activities (jsonb array)
- country (text)
- city (text)
- neighborhood (text)
- latitude (double precision)
- longitude (double precision)
- intentions (jsonb array)
- nationality (text)
- languages (jsonb array)
- relationship_status (text)
- has_children (boolean)
- smoking_habit (text: 'never' | 'occasionally' | 'regularly')
- drinking_habit (text: 'never' | 'socially' | 'regularly')
- cleanliness_level (text: 'low' | 'medium' | 'high')
- noise_tolerance (text: 'low' | 'medium' | 'high')
- work_schedule (text: 'regular' | 'flexible' | 'remote' | 'shift')
- dietary_preferences (jsonb array)
- personality_traits (jsonb array)
- interest_categories (jsonb array)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE

RLS:
- Anyone can view (for swipe deck)
- Only owner can insert/update their own profile
```

#### `owner_profiles` (Owner-specific data)
```
Purpose: Extended profile for owners (providers)
Columns:
- id (uuid, PK)
- user_id (uuid, UNIQUE, FK → auth.users.id)
- business_name (text)
- business_description (text)
- business_location (text)
- contact_email (text)
- contact_phone (text)
- profile_images (jsonb array)
- verified_owner (boolean)
- service_offerings (jsonb array)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE

RLS:
- Anyone can view (for public visibility)
- Only owner can insert/update their own profile
```

---

### 🏠 2. LISTINGS & CONTENT

#### `listings` (Properties/Services)
```
Purpose: All listings (rentals, services, vehicles, etc.)
Columns:
- id (uuid, PK)
- owner_id (uuid, FK → auth.users.id)
- title (text)
- description (text)
- category (listing_category enum)
- listing_type (text: 'rent' | 'sale' | 'service')
- mode (text: 'rent' | 'sale')
- status (text: 'draft' | 'active' | 'inactive' | 'rented' | 'sold')
- is_active (boolean)
- price (numeric)
- currency (text, default 'USD')
- images (jsonb array)
-
- # Location
- address (text)
- city (text)
- neighborhood (text)
- country (text, default 'Mexico')
- state (text)
- latitude (double precision)
- longitude (double precision)
-
- # Property-specific fields
- property_type (text: 'apartment' | 'house' | 'room' | 'studio')
- beds (integer)
- baths (integer)
- square_footage (integer)
- furnished (boolean)
- pet_friendly (boolean)
- house_rules (text)
- amenities (jsonb array)
- services_included (jsonb array)
- rental_rates (jsonb)
- rental_duration_type (text: 'daily' | 'weekly' | 'monthly')
-
- # Vehicle fields
- vehicle_type (text: 'car' | 'motorcycle' | 'bicycle' | 'scooter')
- vehicle_brand (text)
- vehicle_model (text)
- vehicle_condition (text: 'excellent' | 'good' | 'fair')
- year (integer)
- mileage (integer)
- engine_cc (integer)
- fuel_type (text: 'gasoline' | 'diesel' | 'electric' | 'hybrid')
- transmission (text: 'manual' | 'automatic')
- motorcycle_type (text)
- has_abs (boolean)
- has_esc (boolean)
- has_traction_control (boolean)
- has_heated_grips (boolean)
- has_luggage_rack (boolean)
- includes_helmet (boolean)
- includes_gear (boolean)
-
- # Bicycle fields
- bicycle_type (text: 'road' | 'mountain' | 'hybrid' | 'electric')
- frame_size (text)
- frame_material (text)
- number_of_gears (integer)
- suspension_type (text)
- brake_type (text)
- wheel_size (text)
- electric_assist (boolean)
- battery_range (integer)
- includes_lock (boolean)
- includes_lights (boolean)
- includes_basket (boolean)
- includes_pump (boolean)
-
- # Service/Worker fields
- service_category (text)
- custom_service_name (text)
- pricing_unit (text: 'hourly' | 'daily' | 'project')
- experience_level (text: 'beginner' | 'intermediate' | 'expert')
- experience_years (integer)
- service_radius_km (integer)
- minimum_booking_hours (integer)
- offers_emergency_service (boolean)
- background_check_verified (boolean)
- insurance_verified (boolean)
- skills (jsonb array)
- certifications (jsonb array)
- tools_equipment (jsonb array)
- days_available (jsonb array)
- time_slots_available (jsonb array)
- work_type (jsonb array)
- schedule_type (jsonb array)
- location_type (jsonb array)
-
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- idx_listings_owner_id (owner_id)
- idx_listings_category (category)
- idx_listings_status (status)
- idx_listings_city (city)
- idx_listings_is_active (is_active)

Constraints:
- FK to auth.users ON DELETE CASCADE

RLS:
- Anyone can view active listings
- Owners can CRUD their own listings
- Admins can view all
```

---

### 💕 3. MATCHING & INTERACTIONS

#### `likes` (Swipe actions)
```
Purpose: Track user swipes (likes/passes) on listings or profiles
Columns:
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id)
- target_id (uuid) - Can be listing_id OR user_id
- target_type (text: 'listing' | 'profile')
- direction (text: 'right' | 'left', default 'right')
- created_at (timestamptz)

Constraints:
- UNIQUE(user_id, target_id, target_type) - No duplicate swipes
- FK to auth.users ON DELETE CASCADE

Indexes:
- idx_likes_user_id (user_id)
- idx_likes_target (target_id, target_type)

RLS:
- Users can view their own likes
- Users can insert their own likes
```

#### `matches` (Mutual likes)
```
Purpose: Auto-created when both users like each other
Columns:
- id (uuid, PK)
- user_id_1 (uuid, FK → auth.users.id)
- user_id_2 (uuid, FK → auth.users.id)
- listing_id (uuid, FK → listings.id, nullable)
- matched_at (timestamptz)
- is_active (boolean, default true)
- created_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE
- FK to listings ON DELETE SET NULL

Indexes:
- idx_matches_user1 (user_id_1)
- idx_matches_user2 (user_id_2)
- idx_matches_listing (listing_id)

RLS:
- Users can view matches they're part of
```

---

### 💬 4. MESSAGING SYSTEM

#### `conversations` (Chat threads)
```
Purpose: One conversation per match
Columns:
- id (uuid, PK)
- match_id (uuid, FK → matches.id)
- participant_1_id (uuid, FK → auth.users.id)
- participant_2_id (uuid, FK → auth.users.id)
- last_message_at (timestamptz)
- is_active (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to matches ON DELETE CASCADE
- FK to auth.users ON DELETE CASCADE

Indexes:
- idx_conversations_match (match_id)
- idx_conversations_participant1 (participant_1_id)
- idx_conversations_participant2 (participant_2_id)

RLS:
- Users can view conversations they're part of
```

#### `conversation_messages` (Individual messages)
```
Purpose: Messages within conversations
Columns:
- id (uuid, PK)
- conversation_id (uuid, FK → conversations.id)
- sender_id (uuid, FK → auth.users.id)
- content (text)
- message_type (text: 'text' | 'image' | 'file', default 'text')
- attachments (jsonb array)
- read_at (timestamptz, nullable)
- created_at (timestamptz)

Constraints:
- FK to conversations ON DELETE CASCADE
- FK to auth.users ON DELETE CASCADE

Indexes:
- idx_messages_conversation (conversation_id)
- idx_messages_sender (sender_id)
- idx_messages_created (created_at DESC)

RLS:
- Users can view messages in their conversations
- Users can send messages in their conversations

Realtime: Enabled for live updates
```

---

### 💰 5. MONETIZATION

#### `tokens` (Message credits)
```
Purpose: User token balances for pay-per-use messaging
Columns:
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id)
- activation_type (text: 'purchase' | 'subscription' | 'welcome' | 'referral_bonus')
- total_activations (integer) - Total tokens in this grant
- remaining_activations (integer) - Tokens remaining
- used_activations (integer, default 0) - Tokens used
- expires_at (timestamptz, nullable)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE

Indexes:
- idx_tokens_user_id (user_id)
- idx_tokens_expires (expires_at)

RLS:
- Users can view their own tokens
- System can insert/update

Note: Users may have multiple token records (one per purchase/grant)
```

#### `subscription_packages` (Available plans)
```
Purpose: Defines subscription tiers and pay-per-use packs
Columns:
- id (serial, PK)
- name (text)
- description (text)
- price (numeric)
- currency (text, default 'MXN')
- tier (text: 'basic' | 'premium' | 'unlimited' | 'pay_per_use')
- package_category (text: 'client_monthly' | 'owner_monthly' | 'client_pay_per_use' | 'owner_pay_per_use')
- duration_days (integer, default 30)
- tokens (integer, default 0) - Message tokens included
- legal_documents_included (integer, default 0)
- best_deal_notifications (integer, default 0)
- max_listings (integer, default 1)
- early_profile_access (boolean)
- advanced_match_tips (boolean)
- seeker_insights (boolean)
- availability_sync (boolean)
- market_reports (boolean)
- features (jsonb array)
- is_active (boolean, default true)
- created_at (timestamptz)

RLS:
- Anyone can view active packages
- Admins can manage
```

#### `user_subscriptions` (Active subscriptions)
```
Purpose: Track user subscription purchases
Columns:
- id (serial, PK)
- user_id (uuid, FK → auth.users.id)
- package_id (integer, FK → subscription_packages.id)
- is_active (boolean, default true)
- payment_status (text: 'pending' | 'paid' | 'failed' | 'cancelled')
- starts_at (timestamptz)
- expires_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE
- FK to subscription_packages ON DELETE RESTRICT

Indexes:
- idx_subscriptions_user (user_id)
- idx_subscriptions_active (is_active)
- idx_subscriptions_expires (expires_at)

RLS:
- Users can view/manage their own subscriptions
- Admins can view all
```

---

### 📝 6. CONTRACTS & LEGAL

#### `digital_contracts` (Rental/service agreements)
```
Purpose: Digital contracts between owners and clients
Columns:
- id (uuid, PK)
- owner_id (uuid, FK → auth.users.id)
- client_id (uuid, FK → auth.users.id)
- listing_id (uuid, FK → listings.id, nullable)
- template_type (text: 'rental' | 'service' | 'sale')
- title (text)
- content (text) - Contract body
- status (text: 'draft' | 'sent' | 'signed' | 'cancelled')
- owner_signature (text)
- client_signature (text)
- owner_signed_at (timestamptz)
- client_signed_at (timestamptz)
- metadata (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE
- FK to listings ON DELETE SET NULL

RLS:
- Participants can view their own contracts
- Owners can create contracts
- Both can sign
```

---

### ⭐ 7. REVIEWS & RATINGS

#### `reviews` (User/listing reviews)
```
Purpose: Reviews from clients to owners or listings
Columns:
- id (uuid, PK)
- reviewer_id (uuid, FK → auth.users.id) - Who wrote it
- reviewed_id (uuid, FK → auth.users.id) - Who/what is reviewed
- listing_id (uuid, FK → listings.id, nullable)
- rating (integer, 1-5)
- comment (text)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE
- FK to listings ON DELETE CASCADE

Indexes:
- idx_reviews_reviewed (reviewed_id)
- idx_reviews_listing (listing_id)
- idx_reviews_rating (rating)

RLS:
- Anyone can view
- Reviewers can CRUD their own reviews
```

---

### 🔔 8. NOTIFICATIONS

#### `notifications` (In-app notifications)
```
Purpose: System and user notifications
Columns:
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id)
- notification_type (text: 'match' | 'message' | 'like' | 'review' | 'system_announcement')
- title (text)
- message (text)
- is_read (boolean, default false)
- link_url (text, nullable)
- related_user_id (uuid, nullable)
- metadata (jsonb)
- created_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE

Indexes:
- idx_notifications_user_id (user_id)
- idx_notifications_is_read (user_id, is_read)
- idx_notifications_type (notification_type)

RLS:
- Users can view their own notifications
- System can insert

Realtime: Enabled for live notifications
```

---

### ⚙️ 9. USER PREFERENCES

#### `client_filter_preferences` (Search filters)
```
Purpose: Saved search preferences for clients
Columns:
- id (uuid, PK)
- user_id (uuid, UNIQUE, FK → auth.users.id)
- preferred_listing_types (jsonb array, default '["rent"]')
- preferred_categories (jsonb array)
- price_min (numeric)
- price_max (numeric)
- preferred_locations (jsonb array)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- UNIQUE(user_id)
- FK to auth.users ON DELETE CASCADE

RLS:
- Users can view/update their own preferences
```

#### `saved_filters` (Named saved searches)
```
Purpose: Multiple saved filter sets per user
Columns:
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id)
- name (text)
- filter_data (jsonb)
- user_role (text: 'client' | 'owner')
- is_active (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE

RLS:
- Users can CRUD their own saved filters
```

#### `user_visual_preferences` (UI preferences)
```
Purpose: Theme, radio, sound settings
Columns:
- id (uuid, PK)
- user_id (uuid, UNIQUE, FK → auth.users.id)
- radio_current_station_id (text)
- swipe_sound_theme (text, default 'default')
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- UNIQUE(user_id)
- FK to auth.users ON DELETE CASCADE

RLS:
- Users can view/update their own preferences
```

---

### 📊 10. ADMIN & ANALYTICS

#### `admin_audit_log` (NEW - For admin tracking)
```
Purpose: Track all admin actions for compliance
Columns:
- id (uuid, PK)
- admin_user_id (uuid, FK → auth.users.id)
- action_type (text: 'user_banned' | 'listing_removed' | 'contract_reviewed' | 'report_resolved')
- target_type (text: 'user' | 'listing' | 'contract' | 'review')
- target_id (uuid)
- details (jsonb)
- ip_address (text)
- created_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE SET NULL

Indexes:
- idx_audit_admin (admin_user_id)
- idx_audit_created (created_at DESC)

RLS:
- Only admins can view/insert
```

#### `platform_analytics` (NEW - Platform metrics)
```
Purpose: Daily/hourly aggregated metrics
Columns:
- id (uuid, PK)
- metric_date (date)
- metric_hour (integer, nullable)
- total_active_users (integer)
- new_signups (integer)
- total_listings_created (integer)
- total_matches (integer)
- total_messages_sent (integer)
- total_contracts_signed (integer)
- revenue_generated (numeric)
- metadata (jsonb)
- created_at (timestamptz)

Indexes:
- idx_analytics_date (metric_date DESC)

RLS:
- Only admins can view
```

#### `user_reports` (NEW - User-generated reports)
```
Purpose: Reports of inappropriate content/users
Columns:
- id (uuid, PK)
- reporter_id (uuid, FK → auth.users.id)
- reported_user_id (uuid, FK → auth.users.id, nullable)
- reported_listing_id (uuid, FK → listings.id, nullable)
- report_type (text: 'spam' | 'inappropriate' | 'scam' | 'harassment')
- description (text)
- status (text: 'pending' | 'reviewing' | 'resolved' | 'dismissed')
- admin_notes (text)
- resolved_by_admin_id (uuid, FK → auth.users.id, nullable)
- resolved_at (timestamptz)
- created_at (timestamptz)

Constraints:
- FK to auth.users ON DELETE CASCADE

Indexes:
- idx_reports_status (status)
- idx_reports_type (report_type)

RLS:
- Users can create reports
- Admins can view/update all
```

---

## 🔑 Custom Enums & Types

```sql
CREATE TYPE app_role AS ENUM ('client', 'owner', 'admin');

CREATE TYPE listing_category AS ENUM (
  'apartment', 'house', 'room', 'studio',
  'car', 'motorcycle', 'bicycle', 'scooter',
  'plumber', 'electrician', 'cleaner', 'handyman', 'mover',
  'other'
);
```

---

## 🔒 Row Level Security (RLS) Strategy

### General Rules:
1. **Clients & Owners**: Can view public data, manage their own data
2. **Admins**: Can view ALL data across all tables
3. **Auth requirement**: All policies use `auth.uid()` to check user identity

### Admin Access Pattern:
```sql
-- Example admin access policy
CREATE POLICY "Admins can view all"
  ON {table_name}
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
```

---

## ⚡ Essential Functions & Triggers

### 1. Auto Profile Creation
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
-- Creates profiles record automatically
```

### 2. Match Detection
```sql
CREATE FUNCTION detect_mutual_match()
-- Checks if both users liked each other
-- Auto-creates match record
```

### 3. Token Consumption
```sql
CREATE FUNCTION consume_token(user_id UUID)
-- Deducts 1 token when starting a conversation
-- Returns success/failure
```

### 4. Update Timestamps
```sql
CREATE FUNCTION update_updated_at_column()
-- Auto-updates updated_at on all UPDATE operations
```

---

## 📈 Critical Indexes (Performance)

```sql
-- User lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_profiles_city_country ON profiles(city, country);

-- Swipe/match performance
CREATE INDEX idx_likes_user_target ON likes(user_id, target_id, target_type);
CREATE INDEX idx_matches_participants ON matches(user_id_1, user_id_2);

-- Messaging performance
CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_messages_conversation_time ON conversation_messages(conversation_id, created_at DESC);

-- Listing discovery
CREATE INDEX idx_listings_active_city ON listings(is_active, city) WHERE is_active = true;
CREATE INDEX idx_listings_category_status ON listings(category, status);

-- Admin queries
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_reports_pending ON user_reports(status) WHERE status = 'pending';
```

---

## 🔄 Realtime Subscriptions

Enable realtime for these tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
```

---

## 🎨 Admin Dashboard Requirements

### Admin-Only Views

#### `vw_admin_user_summary`
```sql
CREATE VIEW vw_admin_user_summary AS
SELECT
  u.id,
  u.email,
  u.created_at AS signup_date,
  p.full_name,
  p.city,
  p.country,
  ur.role,
  p.is_active,
  p.last_seen_at,
  (SELECT COUNT(*) FROM listings WHERE owner_id = u.id) AS total_listings,
  (SELECT COUNT(*) FROM matches WHERE user_id_1 = u.id OR user_id_2 = u.id) AS total_matches,
  (SELECT COUNT(*) FROM reviews WHERE reviewed_id = u.id) AS reviews_received,
  (SELECT AVG(rating) FROM reviews WHERE reviewed_id = u.id) AS avg_rating
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id;
```

#### `vw_admin_listing_summary`
```sql
CREATE VIEW vw_admin_listing_summary AS
SELECT
  l.id,
  l.title,
  l.category,
  l.status,
  l.price,
  l.city,
  l.created_at,
  op.business_name AS owner_name,
  u.email AS owner_email,
  (SELECT COUNT(*) FROM likes WHERE target_id = l.id AND target_type = 'listing') AS total_likes,
  (SELECT COUNT(*) FROM reviews WHERE listing_id = l.id) AS total_reviews
FROM listings l
LEFT JOIN owner_profiles op ON l.owner_id = op.user_id
LEFT JOIN auth.users u ON l.owner_id = u.id;
```

#### `vw_admin_revenue_summary`
```sql
CREATE VIEW vw_admin_revenue_summary AS
SELECT
  DATE_TRUNC('day', us.created_at) AS purchase_date,
  sp.package_category,
  COUNT(*) AS total_purchases,
  SUM(sp.price) AS total_revenue,
  AVG(sp.price) AS avg_purchase_value
FROM user_subscriptions us
JOIN subscription_packages sp ON us.package_id = sp.id
WHERE us.payment_status = 'paid'
GROUP BY DATE_TRUNC('day', us.created_at), sp.package_category;
```

---

## ✅ Data Integrity Rules

### Foreign Key Cascade Strategy:
- **ON DELETE CASCADE**: profiles, client_profiles, owner_profiles, user_roles, tokens
  - *Reason*: If auth user is deleted, all their data should be removed

- **ON DELETE SET NULL**: listings.owner_id (keep listing history)
  - *Reason*: Preserve historical data even if user is deleted

- **ON DELETE RESTRICT**: subscription_packages
  - *Reason*: Don't delete packages that have active subscriptions

### Constraints:
- All email addresses must be lowercase
- Phone numbers should follow E.164 format
- Prices must be >= 0
- Ratings must be 1-5
- Token balances cannot be negative

---

## 🚀 Migration Strategy

### Recommended Order:
1. Create enums and types
2. Create core tables (profiles, user_roles)
3. Create specialized tables (client_profiles, owner_profiles)
4. Create content tables (listings)
5. Create interaction tables (likes, matches)
6. Create messaging tables (conversations, messages)
7. Create monetization tables (tokens, subscriptions)
8. Create admin tables (audit_log, reports)
9. Add all foreign keys
10. Add all indexes
11. Enable RLS on all tables
12. Create RLS policies
13. Create functions and triggers
14. Create admin views
15. Enable realtime subscriptions

---

## 📱 App-Specific Access Patterns

### Main App (Client/Owner):
- ✅ View own profile
- ✅ View all active listings
- ✅ Create/view matches
- ✅ Send/receive messages
- ✅ Manage subscriptions
- ❌ Cannot view other users' private data
- ❌ Cannot access admin tables

### Admin Dashboard:
- ✅ View all users (via `vw_admin_user_summary`)
- ✅ View all listings (via `vw_admin_listing_summary`)
- ✅ View revenue (via `vw_admin_revenue_summary`)
- ✅ Review reports (`user_reports`)
- ✅ Audit logs (`admin_audit_log`)
- ✅ Ban users (update `profiles.is_active`)
- ✅ Remove listings (update `listings.status`)

---

## 🔧 Maintenance Tasks

### Daily:
- Expire old tokens (WHERE expires_at < NOW())
- Deactivate expired subscriptions
- Aggregate analytics data

### Weekly:
- Clean up old notifications (>30 days, is_read = true)
- Archive resolved reports (>90 days)

### Monthly:
- Generate platform analytics summaries
- Review top users/listings

---

## 🎯 Next Steps

1. **Review this schema** - Does it match your needs?
2. **Run the clean SQL** (next file) in Supabase SQL Editor
3. **Apply migrations** - Or use Supabase CLI
4. **Seed test data** - Create sample users, listings, matches
5. **Test RLS policies** - Verify permissions work correctly
6. **Build admin dashboard** - Use the views provided

---

**Questions to Consider:**
- Do you need multi-language support? (Add `i18n` tables)
- Do you want user verification? (Add `user_verifications` table)
- Do you need payment tracking? (Add `payment_transactions` table)
- Do you want favorite listings? (Add `favorites` table)
- Do you need listing availability calendar? (Add `listing_availability` table)
