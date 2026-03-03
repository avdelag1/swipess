

## Plan: Fix App Crash + Polish Bottom Navigation for Both Themes

### Problem 1: App Stuck on Splash Screen
The `.env` file was accidentally deleted in the previous edit. The Supabase client throws `"Missing Supabase environment variables"` which crashes the entire app before React can mount. The splash screen stays forever because nothing removes it.

**Fix:** Restore the `.env` file with the correct Supabase variables. This file is auto-generated — I will recreate it with the known project values:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`  
- `VITE_SUPABASE_URL`

### Problem 2: Bottom Navigation Theme Polish
The bottom nav already has good theme-aware logic. Minor refinements needed:

**File: `src/components/BottomNavigation.tsx`**
- Light mode `bgDefault`: increase from `0.06` to `0.08` for slightly more visible pill backgrounds
- Light mode `bgActive`: increase from `0.12` to `0.14` for clearer active state
- Dark mode inactive label opacity: already `0.7`, increase to `0.8` for better readability
- Both themes already use proper icon colors and active gradients — no structural changes needed

### Scope
- Restore `.env` (critical — app won't load without it)
- Tweak 4 opacity values in BottomNavigation for better contrast in both themes
- No layout, routing, or structural changes

