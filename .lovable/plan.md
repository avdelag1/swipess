
# Theme Color Audit - White & Dark Mode Issues

## Summary of Findings

After auditing the codebase, I found **widespread hardcoded color classes** that don't adapt to theme changes. This causes text and backgrounds to become invisible or have poor contrast when switching between white-matte (light) and dark themes.

---

## Critical Issues Found

### 1. Pages with 100% Hardcoded Dark Colors (Broken in White Mode)
These pages are completely unusable in white-matte theme:

| File | Issue |
|------|-------|
| `src/pages/OwnerLawyerServices.tsx` | All `text-white`, `text-gray-400`, `bg-gray-800`, `bg-gray-900` |
| `src/components/LegalDocumentsDialog.tsx` | `bg-gray-800`, `text-white`, `border-gray-700` everywhere |
| `src/components/radio/*` | All radio components use hardcoded white text |

### 2. Components with Partial Hardcoding (33 files detected)
Uses `text-gray-*` instead of `text-muted-foreground`:
- `ClientFilters.tsx` - Conditional but still uses `text-white` 
- `OwnerFilters.tsx` - Same pattern
- `SubscriptionPackages.tsx` - `bg-white/[0.03]` won't work in light
- `PropertyListingForm.tsx` - `bg-white/[0.02]` patterns

### 3. Commonly Misused Classes

| Hardcoded Class | Should Be | Count |
|----------------|-----------|-------|
| `text-white` | `text-foreground` | 4135 matches |
| `text-gray-400` | `text-muted-foreground` | 927 matches |
| `bg-gray-800` | `bg-card` or `bg-secondary` | 100+ matches |
| `bg-white/[0.03]` | `bg-muted/50` | 50+ matches |

---

## Theme Variable Reference

The theme system already defines semantic tokens:
```css
/* Dark themes */
--foreground: 0 0% 100%;      /* White text */
--muted-foreground: 0 0% 72%; /* Gray text */

/* White-matte */  
--foreground: 0 0% 1%;        /* Black text */
--muted-foreground: 0 0% 45%; /* Gray text */
```

---

## Implementation Plan

### Phase 1: Critical Fixes (High Impact)
1. **OwnerLawyerServices.tsx** - Replace all hardcoded colors
2. **LegalDocumentsDialog.tsx** - Convert to semantic tokens
3. **Radio components** - Add theme awareness

### Phase 2: Systematic Replacements
For each file, replace:
```tsx
// FROM:
className="text-white bg-gray-800 border-gray-700"

// TO:
className="text-foreground bg-card border-border"
```

```tsx
// FROM:
className="text-gray-400"

// TO:
className="text-muted-foreground"
```

### Phase 3: Pattern Updates
Replace opacity-based whites with semantic tokens:
```tsx
// FROM:
className="bg-white/[0.03]"

// TO:  
className="bg-muted/50" // or "bg-secondary/50"
```

---

## Files to Fix (Priority Order)

### Tier 1 - Completely Broken
1. `src/pages/OwnerLawyerServices.tsx`
2. `src/components/LegalDocumentsDialog.tsx`
3. `src/components/radio/retro/StationDrawer.tsx`
4. `src/components/radio/retro/BlueCassette.tsx`

### Tier 2 - Partially Broken  
5. `src/components/SubscriptionPackages.tsx`
6. `src/components/PropertyListingForm.tsx`
7. `src/pages/ClientFilters.tsx`
8. `src/pages/OwnerFilters.tsx`

### Tier 3 - Minor Issues
9. `src/components/LikedClients.tsx` (already has `isLight` check, needs review)
10. `src/components/NotificationsDialog.tsx` (has theme checks, verify completeness)

---

## Semantic Token Mapping

| Use Case | Token Class |
|----------|-------------|
| Primary text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Card backgrounds | `bg-card` |
| Elevated surfaces | `bg-secondary` |
| Borders | `border-border` |
| Input backgrounds | `bg-input` |

---

## Estimated Changes
- **~20 files** need updates
- **~500 class replacements** total
- **No logic changes** - purely class name swaps
