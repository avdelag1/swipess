

## Plan: Force light theme and reset dark theme from user profiles

The dashboard is still dark because the user's profile in the database has `theme_preference` set to `'dark'` or `'black-matte'`. When the user logs in, `useTheme.tsx` loads this from the DB and overrides the default `'light'`.

### Two fixes needed:

**1. Reset all existing users' theme to 'light' (database migration)**

Run a SQL migration:
```sql
UPDATE public.profiles SET theme_preference = 'light' WHERE theme_preference IS DISTINCT FROM 'light';
```

**2. Ignore stored dark theme in `useTheme.tsx`**

Since the user wants a white-only app, modify `normalizeTheme()` to always return `'light'` regardless of what's stored:

```typescript
function normalizeTheme(raw: string | null | undefined): Theme {
  return 'light'; // Force light theme — dark mode disabled
}
```

This ensures even if a profile somehow has 'dark' stored, it won't apply.

**3. Hide/remove the ThemeToggle button** so users can't switch back to dark.

Search for all `<ThemeToggle` usages and remove them from the UI. The component file can stay for future use.

### Files to edit

| File | Change |
|------|--------|
| `src/hooks/useTheme.tsx` | `normalizeTheme()` always returns `'light'` |
| DB migration | Reset all profiles to `theme_preference = 'light'` |
| Files rendering `<ThemeToggle>` | Remove the toggle from UI |

