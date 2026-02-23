

# Fix White Theme on Owner Pages, Swipe Card Position, and Listing Upload

## Overview

Multiple issues need fixing:
1. Several owner-side pages (PropertyManagement, LikedClients, ClientLikedProperties) have hardcoded dark backgrounds that don't adapt to white-matte theme
2. Swipe card info (rating, name) overlaps with action buttons on mobile
3. PropertyManagement still uses old `toast()` syntax causing build errors
4. Email signup works correctly (confirmed 11 email users in database with profiles + roles) -- no backend fix needed

---

## Part 1: White Theme Fixes

### PropertyManagement.tsx (Owner Listings Page)
The entire component uses hardcoded `bg-gray-900`, `bg-gray-800`, `text-white` classes. Needs theme-aware styling:
- Import `useTheme` hook, create `isLight` flag
- Replace `bg-gray-900` with `isLight ? 'bg-[#f5f5f5]' : 'bg-gray-900'`
- Replace `bg-gray-800` cards with `isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'`
- Replace `text-white` headings with `text-foreground`
- Replace `text-white/60` subtitles with `text-muted-foreground`
- Update search input, tabs, loading and error states

### OwnerListingsStats.tsx
Uses `bg-gray-800/40`, `text-white`, `text-white/60` throughout. Needs:
- Import `useTheme`, pass `isLight` to stat card rendering
- Replace glass surfaces with theme-aware equivalents

### LikedClients.tsx (Owner Liked Clients)
Hardcoded `background: '#070709'` on the root div, plus `text-white`, `rgba(255,255,255,...)` everywhere. Needs:
- Import `useTheme`, build theme-aware `colors` object (same pattern as OwnerFilters)
- Update root background, header, search bar, category pills, client cards, empty state

### ClientLikedProperties.tsx (Client Liked Properties)
Hardcoded `rgba(255,255,255,...)` patterns in refresh button, category tabs, count indicator, card body, empty state. Needs:
- Import `useTheme`, add `isLight` conditional styling
- Update tab pills: inactive state uses `text-white/60` and `rgba(255,255,255,0.06)` -- swap to dark equivalents in light theme
- Update card body metadata pills, amenity badges, empty state

---

## Part 2: Swipe Card Info Position Fix

### Problem
On the owner swipe deck (`/owner/liked-clients` screenshot), the rating badge + name "New User" sits at `bottom-24` which puts it right behind the action buttons (Like, Dislike, Share, etc.) on mobile phones.

### Fix (SimpleSwipeCard.tsx + SimpleOwnerSwipeCard.tsx)
Both files have the content overlay positioned at `bottom-24` (line 505 in SimpleSwipeCard, line 662 in SimpleOwnerSwipeCard). Change to `bottom-32` to push the info section higher, creating comfortable clearance above the floating action buttons.

This is a single class change per file -- no layout restructuring needed.

---

## Part 3: Fix Toast Syntax in PropertyManagement.tsx

Lines 157, 170, 180, 193, 209, 219 still use the old `toast({ title, description, variant })` syntax. Convert to sonner syntax:
- `toast({ title: 'Deleting...', description: '...' })` becomes `toast('Deleting...', { description: '...' })`
- `toast({ title: 'Error', variant: 'destructive' })` becomes `toast.error('Error', { description: '...' })`

---

## Part 4: Email Signup Backend Verification

After checking the database, email signups ARE working correctly:
- 11 email-provider users exist in `auth.users`
- All have matching `profiles` records (via `handle_new_user` trigger)
- All have `user_roles` entries (role: client)
- The `signUp` function in `useAuth.tsx` correctly calls `supabase.auth.signUp()` and `createProfileIfMissing()`

No backend changes needed -- the user might have been checking a different database or the data wasn't visible due to the backend UI.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/PropertyManagement.tsx` | Theme-aware colors + fix toast syntax |
| `src/components/OwnerListingsStats.tsx` | Theme-aware colors |
| `src/components/LikedClients.tsx` | Theme-aware colors (full page) |
| `src/pages/ClientLikedProperties.tsx` | Theme-aware colors |
| `src/components/SimpleSwipeCard.tsx` | Move content overlay from `bottom-24` to `bottom-32` |
| `src/components/SimpleOwnerSwipeCard.tsx` | Move content overlay from `bottom-24` to `bottom-32` |

## What Stays Unchanged
- All swipe physics and card interaction logic
- Authentication flow (signup, signin, OAuth)
- Database schema and RLS policies
- Routing architecture
- Owner Filters page (already has full theme support)
- Owner Profile page (already has theme support)
- Client Profile page (already has theme support)

