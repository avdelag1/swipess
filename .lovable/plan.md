# Boomerang Video Loops — Plan

One short, silent, auto-looping video per item, used across **listings (client + owner)**, **user profiles (client + owner)**, and **events**. Plays as the first "slide" of the swipe card, like Instagram Reels but always muted, always looping.

## Spec
- **1 video per item** (no multiples — keeps storage and load fast)
- **Max 6 seconds** (boomerang-style); enforced client-side before upload
- **Max 25 MB** file size; accepted formats: mp4, mov, webm
- **Always muted, autoplay, loop, playsInline** — never plays audio anywhere in the app
- **Plays as first slide** of the card image carousel, then user can swipe through photos
- Optional — user can leave it blank, photos remain mandatory (1 photo rule preserved)

## Backend (Supabase `qegyisokrxdsszzswsqk`)

Reusing existing infra — no new buckets needed:

| Surface | Storage bucket (exists) | Column |
|---|---|---|
| Listings (property/vehicle/service/etc.) | `listing-videos` (public) | `listings.video_url` ✅ already exists |
| Events | `listing-videos` (public, reused) | `events.video_url` — **new column** |
| Client profile | `profile-images` bucket → new `videos/` folder | `client_profiles.video_url` — **new column** |
| Owner profile | `profile-images` bucket → new `videos/` folder | `owner_profiles.video_url` — **new column** |

**Migration:** add `video_url text` to `events`, `client_profiles`, `owner_profiles`. Storage RLS for `listing-videos` and `profile-images` already allows owner-only writes; videos folder follows the same pattern.

## Frontend changes

1. **New shared component `LoopVideo.tsx`**
   - `<video muted autoPlay loop playsInline preload="metadata" poster={firstImage}>`
   - Boomerang effect: when video reaches end, alternates `playbackRate` between `1` and `-1` for true ping-pong feel (with mp4 fallback to plain loop on browsers that don't support reverse).
   - Lazy-mounts via IntersectionObserver — pauses off-screen to save battery.

2. **New shared upload component `VideoUploader.tsx`**
   - File input → reads metadata → rejects if `duration > 6s` or `size > 25MB` with a NotificationBar message.
   - Uploads to the right bucket/path, writes URL back to the form.
   - Shows tiny inline preview + "Replace" / "Remove" controls.

3. **Forms — wire `VideoUploader` into:**
   - `src/components/UnifiedListingForm.tsx` (already references `video_url`, just needs the uploader UI)
   - `src/components/EventForm.tsx` (or wherever events are created)
   - Client profile editor (`ClientProfileForm` / equivalent)
   - Owner profile editor (`OwnerProfileForm` / equivalent)

4. **Cards — render `LoopVideo` as first slide when `video_url` present:**
   - `src/components/SimpleSwipeCard.tsx` (client deck)
   - `src/components/SimpleOwnerSwipeCard.tsx` (owner deck)
   - `src/components/swipe/SwipeCardPeek.tsx`
   - `src/components/PremiumLikedCard.tsx`
   - `src/components/EventCard.tsx`
   - Profile detail / preview surfaces

5. **No audio anywhere** — `muted` is hard-coded, no controls UI exposed. Respects existing global "no in-app sounds" rule.

## What stays untouched
- Swipe physics, magnifier, action buttons cluster, soft-dismiss, notifications — all preserved
- The mandatory 1-photo rule still applies; video is purely additive
- Existing `listings.video_url` data continues to work

## Out of scope
- Trimming/editing videos in-app (user uploads pre-trimmed)
- Sound on videos (permanently disabled per project rule)
- Multiple videos per item (locked to 1 by design)
