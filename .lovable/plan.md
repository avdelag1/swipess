

# Content Moderation & Security System

## Current State

The `validateNoContactInfo()` function exists in `src/utils/contactInfoValidation.ts` with solid regex patterns for phone numbers, emails, social media handles, and URLs — but it is **never imported or used anywhere in the app**. Zero enforcement.

## Attack Surface — All User-Editable Text Fields

1. **Listing forms** (4 forms): `title`, `description`, `house_rules` (Property, Motorcycle, Bicycle, Worker)
2. **Client Profile Dialog**: `name` field (bio is disabled)
3. **Owner Profile Dialog**: `businessName`, `businessLocation`, `contactEmail`, `contactPhone`
4. **Messaging**: `MessagingInterface.tsx` — chat messages, `SwipessSwipeContainer` / `ClientSwipeContainer` — first-contact messages
5. **Reviews**: `RatingSubmissionDialog` — review text
6. **Reports**: `ReportDialog` — report descriptions (less critical but still worth guarding)

## Implementation Plan

### 1. Enhance `contactInfoValidation.ts`

Add more evasion-resistant patterns:
- Spaced-out numbers: `5 5 5 1 2 3 4 5 6 7`
- Letter substitutions: `at` for `@`, `dot` for `.`
- WhatsApp-specific: `my whats`, `wsp`, `w.a`
- Add a `sanitizeAndValidate()` wrapper that strips zero-width characters before checking
- Add severity levels: `block` (prevent submission) vs `flag` (allow but mark for admin review)

### 2. Create `useContentModeration` Hook

A reusable hook that:
- Takes a text value, returns `{ error: string | null, isClean: boolean }`
- Wraps `validateNoContactInfo` for easy integration
- Optionally logs flagged content to a `content_flags` database table for admin review

### 3. Create `content_flags` Database Table

Store flagged content for the admin app to query:
```sql
CREATE TABLE content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'message', 'listing_title', 'listing_description', 'profile_name', 'review'
  content_text TEXT NOT NULL,
  flag_reason TEXT NOT NULL, -- 'phone', 'email', 'social_media', 'url'
  source_id UUID, -- listing_id, conversation_id, review_id
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT now()
);
```
With RLS: users can insert their own flags, only admins can read all.

### 4. Wire Validation Into Every Text Input Point

**Listing Forms** (`PropertyListingForm`, `MotorcycleListingForm`, `BicycleListingForm`, `WorkerListingForm`):
- Add `onBlur` validation on `title`, `description`, `house_rules` fields
- Show inline error toast when contact info detected
- Block submission in `UnifiedListingForm.handleSubmit()` if any field fails validation

**Messaging** (`MessagingInterface.tsx`, `SwipessSwipeContainer`, `ClientSwipeContainer`):
- Validate message text before `sendMessage.mutateAsync()` / conversation creation
- Block send and show error if contact info detected
- Log to `content_flags` table

**Client Profile Dialog**:
- Validate `name` field on save

**Owner Profile Dialog**:
- `contactEmail` and `contactPhone` are legitimate business fields — skip validation on those
- Validate `businessName` and `businessLocation` for social media / URL embedding

**Reviews** (`RatingSubmissionDialog`):
- Validate review comment text before submission

### 5. Image Moderation (Best Effort)

For photo uploads, we can create a backend function that uses AI to analyze images. Using Lovable AI (Gemini), we can:
- Create an edge function `moderate-image` that receives an image URL
- Sends it to Gemini for analysis with a prompt checking for: nudity/explicit content, text overlays with contact info, brand logos
- Returns a moderation verdict
- Call this after upload in `ClientProfileDialog`, `OwnerProfileDialog`, and `UnifiedListingForm`
- Flag images in `content_flags` table if issues detected

### Files Modified

1. **`src/utils/contactInfoValidation.ts`** — Enhanced patterns, severity levels, evasion resistance
2. **`src/hooks/useContentModeration.ts`** — New hook wrapping validation + DB logging
3. **`src/components/PropertyListingForm.tsx`** — onBlur validation on title, house_rules
4. **`src/components/MotorcycleListingForm.tsx`** — onBlur validation on title, description
5. **`src/components/BicycleListingForm.tsx`** — onBlur validation on title, description
6. **`src/components/WorkerListingForm.tsx`** — onBlur validation on title, description
7. **`src/components/UnifiedListingForm.tsx`** — Block submit if validation fails
8. **`src/components/MessagingInterface.tsx`** — Validate before send
9. **`src/components/SwipessSwipeContainer.tsx`** — Validate first-contact messages
10. **`src/components/ClientSwipeContainer.tsx`** — Validate first-contact messages
11. **`src/components/ClientProfileDialog.tsx`** — Validate name field
12. **`src/components/OwnerProfileDialog.tsx`** — Validate business name/location
13. **`src/components/RatingSubmissionDialog.tsx`** — Validate review text
14. **New: `supabase/functions/moderate-image/index.ts`** — AI image moderation edge function
15. **DB migration** — `content_flags` table with RLS

### What This Does NOT Change
- Existing form logic/routing
- Existing messaging infrastructure
- Owner contact email/phone fields (legitimate business info)

