

# Full Theme & Bug Audit - Comprehensive Findings

## Critical Issues Identified

### 1. **Public-Facing Pages - Completely Hardcoded (5 files)**

These pages use full-dark hardcoded gradients that break completely in white-matte:

| File | Issue |
|------|-------|
| `PublicListingPreview.tsx` | `bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900` everywhere |
| `PublicProfilePreview.tsx` | Same hardcoded dark gradients throughout |
| `ResetPassword.tsx` | `bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900` |
| `SwipeInsights.tsx` | `bg-gradient-to-br from-gray-900 to-black` |
| `SignupErrorBoundary.tsx` | `bg-gradient-to-br from-gray-900 via-black to-gray-800` |

### 2. **Contract/Signature System - Light Mode Only (2 files)**

| File | Issue |
|------|-------|
| `ContractSigningDialog.tsx` | `bg-gray-50`, `text-gray-600`, `text-gray-700`, `bg-green-50` - invisible in dark mode |
| `DigitalSignaturePad.tsx` | `border-gray-300`, `border-gray-200`, `text-gray-500`, `bg-gray-50` - breaks in dark |

### 3. **Button Component - Hardcoded Zinc Colors**

`button.tsx` uses `bg-zinc-950`, `text-zinc-900`, `border-zinc-200` for default variants - doesn't adapt to theme. The `glassLight` variant is fine, but other variants break.

### 4. **AI Test Page - Mixed Zinc (1 file)**

`AITestPage.tsx` uses `bg-zinc-800`, `bg-zinc-900`, `text-zinc-400`, `text-zinc-300`, `text-zinc-500` - won't work in white-matte.

### 5. **Owner Profile Dialog - Fully Dark Hardcoded**

`OwnerProfileDialog.tsx` uses:
- `bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95`
- `bg-zinc-900 border-white/10` on all inputs
- `text-white`, `placeholder:text-zinc-500`

### 6. **Settings Page - Zinc Throughout**

`ClientSettingsNew.tsx` uses `text-zinc-500`, `text-zinc-600`, `bg-zinc-500/20` - breaks in white-matte.

---

## Token Replacements Required

| Hardcoded | Semantic Replacement |
|-----------|---------------------|
| `from-gray-900 via-gray-800 to-gray-900` | `bg-background` |
| `bg-gray-800/50 border-gray-700/50` | `bg-card border-border` |
| `bg-gray-50` | `bg-muted` |
| `text-gray-600/700` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-green-50` | `bg-emerald-500/10` (works both themes) |
| `bg-zinc-900` | `bg-secondary` |
| `text-zinc-400/500/600` | `text-muted-foreground` |
| `border-gray-300` | `border-border` |

---

## Files to Fix (Priority Order)

### Tier 1 - Public Pages (User-facing, critical)
1. `src/pages/PublicListingPreview.tsx` - ~25 replacements
2. `src/pages/PublicProfilePreview.tsx` - ~20 replacements
3. `src/pages/ResetPassword.tsx` - ~5 replacements
4. `src/components/SignupErrorBoundary.tsx` - ~5 replacements

### Tier 2 - Core Components (Dialogs & Forms)
5. `src/components/ContractSigningDialog.tsx` - ~15 replacements
6. `src/components/DigitalSignaturePad.tsx` - ~12 replacements
7. `src/components/OwnerProfileDialog.tsx` - ~20 replacements
8. `src/pages/AITestPage.tsx` - ~18 replacements

### Tier 3 - UI Components
9. `src/components/ui/button.tsx` - Add theme-aware default variants
10. `src/pages/ClientSettingsNew.tsx` - ~8 replacements
11. `src/components/SwipeInsights.tsx` - ~10 replacements
12. `src/components/MatchCelebration.tsx` - ~6 replacements

---

## Implementation Strategy

**For each file:**
1. Replace gradient backgrounds with `bg-background`
2. Replace gray surface colors with `bg-card`, `bg-secondary`, `bg-muted`
3. Replace text colors with `text-foreground`, `text-muted-foreground`
4. Replace borders with `border-border`
5. Convert semantic colored backgrounds (green-50, blue-50) to opacity-based versions that work both themes (e.g., `bg-emerald-500/10`)

**Button.tsx special handling:**
- Keep glass variants as-is
- Update default/outline/secondary/ghost variants to use semantic tokens

---

## Estimated Scope
- **~15 files** need updates
- **~200+ class replacements**
- **No logic changes** - purely styling fixes
- All changes improve white-matte compatibility while preserving dark theme appearance

