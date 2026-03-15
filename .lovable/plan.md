

## Plan: Fix mini player movement + fix Hub colors for light theme

### Issues Found

1. **Mini player bobbing** — Line 130 has `animate={{ y: [0, -8, 0] }}` causing constant floating animation. Also fully draggable.
2. **Hub components use hardcoded dark-theme colors** — All 4 Hub components (`MyHub.tsx`, `MyHubProfileHeader.tsx`, `MyHubActivityFeed.tsx`, `MyHubQuickFilters.tsx`) use `text-white`, `bg-black/40`, `bg-white/5`, `border-white/5` etc. which are invisible on a white background.
3. **No runtime errors** — only a minor accessibility warning about a missing `aria-describedby`.

---

### Fix 1: Stop mini player from moving

**`src/components/RadioMiniPlayer.tsx`**
- Remove the bobbing animation (`animate={{ y: [0, -8, 0] }}`) on the inner `motion.div` — make it a regular `div`
- Remove `drag` and all drag-related props/handlers from the outer `motion.div` — fix it in place
- Remove the `GripVertical` drag handle icon
- Remove `position` state and `constraintsRef` (no longer needed)

### Fix 2: Convert Hub components to theme-aware tokens

**`src/components/MyHubProfileHeader.tsx`**
- `bg-black/40` → `bg-muted/60`
- `border-white/5` → `border-border`
- `text-white` → `text-foreground`
- `bg-white/5` → `bg-muted`

**`src/components/MyHubActivityFeed.tsx`**
- Same pattern: replace all `text-white`, `bg-black/40`, `border-white/5` with semantic tokens

**`src/components/MyHubQuickFilters.tsx`**
- `bg-white/[0.03]` → `bg-muted/30`
- `border-white/5` → `border-border`
- `text-white` → `text-foreground`
- `bg-white/5` → `bg-muted`

**`src/pages/MyHub.tsx`**
- `bg-white/5` → `bg-muted`
- `text-white/50` → `text-muted-foreground`

### Files to edit (5 total)

| File | Change |
|------|--------|
| `RadioMiniPlayer.tsx` | Remove drag + bobbing animation |
| `MyHubProfileHeader.tsx` | Dark→semantic color tokens |
| `MyHubActivityFeed.tsx` | Dark→semantic color tokens |
| `MyHubQuickFilters.tsx` | Dark→semantic color tokens |
| `MyHub.tsx` | Dark→semantic color tokens |

