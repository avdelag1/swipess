

## Fix: Owner Swipe Cards Not Showing Any Users

### Root Cause
The owner swipe deck queries the `profiles` table, but all 6 users in the database have `full_name = null` and `images = []` in that table. Line 1143 of `useSmartClientMatching` filters out any profile without `full_name`, so zero profiles make it through.

Meanwhile, the `client_profiles` table has all the real data (names, photos, ages, cities) but is not being used by the owner deck.

### Solution (Two-Part Fix)

**Part 1: Enrich profiles from client_profiles data**

After fetching from `profiles`, also fetch from `client_profiles` and merge the data. This way, if a user has filled out their client profile (name, images), that data supplements the sparse `profiles` record.

**Part 2: Remove the strict full_name filter**

Instead of filtering out profiles without `full_name`, show them with a fallback name like "New User". This ensures every signed-up user appears in the owner deck, even if they haven't completed their profile yet.

### Technical Details

**File: `src/hooks/useSmartMatching.tsx`** (in `useSmartClientMatching`, ~lines 1057-1155)

1. After fetching profiles from the `profiles` table, also fetch from `client_profiles` to get supplementary data:
```typescript
const { data: clientProfileData } = await supabase
  .from('client_profiles')
  .select('user_id, name, age, gender, city, country, profile_images, bio, interests, nationality, languages, neighborhood')
  .limit(200);

// Build lookup map
const clientProfileMap = new Map();
if (clientProfileData) {
  for (const cp of clientProfileData) {
    clientProfileMap.set(cp.user_id, cp);
  }
}
```

2. In the profile mapping step, merge client_profiles data and remove the strict `full_name` filter:
```typescript
let filteredProfiles = (profiles as any[])
  .filter(profile => {
    if (profile.user_id === userId) return false;
    return true; // Show ALL signed-up users
  })
  .map(profile => {
    const cpData = clientProfileMap.get(profile.user_id);
    const name = profile.full_name || cpData?.name || 'New User';
    const images = (profile.images?.length > 0 ? profile.images : null)
      || (cpData?.profile_images?.length > 0 ? cpData.profile_images : null)
      || ['/placeholder-avatar.svg'];
    return {
      ...profile,
      full_name: name,
      images,
      age: profile.age || cpData?.age || null,
      gender: profile.gender || cpData?.gender || null,
      city: profile.city || cpData?.city || null,
      country: profile.country || cpData?.country || null,
      bio: profile.bio || cpData?.bio || null,
      nationality: profile.nationality || cpData?.nationality || null,
      neighborhood: profile.neighborhood || cpData?.neighborhood || null,
    };
  });
```

3. In the final mapping to `MatchedClientProfile`, use `full_name` as the `name` field and `images` as `profile_images` so the card component renders correctly.

This ensures every user who signs up appears as a swipe card on the owner side -- with their photo and name if available, or a placeholder if not.

