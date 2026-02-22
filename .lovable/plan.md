

# Fix Owner-Side White Theme + Build Errors

## Overview

Two categories of issues need fixing:
1. Owner-side pages have hardcoded dark colors that look broken in white-matte theme
2. Build errors from incorrect `toast()` usage and edge function type casting

---

## Part 1: White-Matte Theme Fixes (Owner Pages)

The following owner pages use hardcoded `rgba(255,255,255,...)` backgrounds and `text-white` colors that become invisible on a white background. Each needs theme-aware styling using `useTheme()` hook.

### Files to fix:

**OwnerProfileNew.tsx** - Back button uses hardcoded white text, Settings button uses `rgba(255,255,255,0.05)` background and `rgba(255,255,255,0.85)` text color. Filter Colors card uses hardcoded dark glass surface.

**OwnerFilters.tsx** - Entire page uses `#070709` background, all text is white, all surfaces use `rgba(255,255,255,...)` patterns. Needs full theme-aware color object (same approach used for ClientFilters).

**OwnerProperties.tsx** - Back button uses `text-white/60 hover:text-white`.

**ClientProfileNew.tsx** (also affected) - Back button, About/Interests sections, Settings button all use hardcoded white-on-dark colors.

### Approach:
For each file, import `useTheme` and create a `isLight` flag. Replace hardcoded inline `style` colors with conditional values. Use semantic classes (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`) where possible, and theme-conditional inline styles where semantic classes aren't sufficient.

---

## Part 2: Fix Toast Build Errors (11 files)

The project uses `sonner` for toasts, but 11 components call `toast()` with the old shadcn/radix syntax: `toast({ title: '...', description: '...' })`. Sonner expects: `toast('Title', { description: '...' })` or `toast.error('Title', { description: '...' })`.

### Files to fix:
- `CameraCapture.tsx` (4 instances)
- `ClientInsightsDialog.tsx` (2 instances)
- `ClientPreferencesDialog.tsx` (2 instances)
- `ClientProfileDialog.tsx` (3 instances)
- `ContractUploadDialog.tsx` (6 instances)
- `LegalDocumentsDialog.tsx` (6 instances)
- `MessageAttachments.tsx` (3 instances)
- `OwnerClientFilterDialog.tsx` (2 instances)
- `OwnerSettingsDialog.tsx` (3 instances)
- `PWAInstallBanner.tsx` (1 instance)
- `PhotoUploadManager.tsx` (2+ instances)

### Transformation pattern:
```
// BEFORE (broken):
toast({ title: 'Error', description: 'Something failed', variant: 'destructive' });

// AFTER (correct sonner syntax):
toast.error('Error', { description: 'Something failed' });
```

- `variant: 'destructive'` maps to `toast.error()`
- No variant maps to `toast()` or `toast.success()`

---

## Part 3: Fix Edge Function Type Error

**File:** `supabase/functions/send-push-notification/index.ts`

Line 142 still fails because `salt: authBytes` and `info: authInfo` are `Uint8Array<ArrayBufferLike>` but HKDF params need `BufferSource`. Cast these with `.buffer` property:

```typescript
{ name: "HKDF", hash: "SHA-256", 
  salt: new Uint8Array(authBytes) as unknown as BufferSource, 
  info: new Uint8Array(authInfo) as unknown as BufferSource }
```

Same fix needed for lines 150 and 156 where `salt` and `info` params appear.

---

## Summary of All Files Changed

| File | Change Type |
|------|------------|
| `src/pages/OwnerProfileNew.tsx` | Theme-aware colors |
| `src/pages/OwnerFilters.tsx` | Theme-aware colors |
| `src/pages/OwnerProperties.tsx` | Theme-aware colors |
| `src/pages/ClientProfileNew.tsx` | Theme-aware colors |
| `src/components/CameraCapture.tsx` | Fix toast syntax |
| `src/components/ClientInsightsDialog.tsx` | Fix toast syntax |
| `src/components/ClientPreferencesDialog.tsx` | Fix toast syntax |
| `src/components/ClientProfileDialog.tsx` | Fix toast syntax |
| `src/components/ContractUploadDialog.tsx` | Fix toast syntax |
| `src/components/LegalDocumentsDialog.tsx` | Fix toast syntax |
| `src/components/MessageAttachments.tsx` | Fix toast syntax |
| `src/components/OwnerClientFilterDialog.tsx` | Fix toast syntax |
| `src/components/OwnerSettingsDialog.tsx` | Fix toast syntax |
| `src/components/PWAInstallBanner.tsx` | Fix toast syntax |
| `src/components/PhotoUploadManager.tsx` | Fix toast syntax |
| `supabase/functions/send-push-notification/index.ts` | Fix Uint8Array cast |

