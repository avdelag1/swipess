

# Fix All Build Errors

## Overview

There are 4 categories of build errors, all straightforward fixes:

1. **Toast import errors** (AccountSecurity, AuthDialog, AIListingAssistant) -- importing `toast` from `'sonner'` directly instead of from the compatibility wrapper
2. **CascadeFilterButton** -- `MouseEvent` type mismatch in event listeners
3. **ClientInsightsDialog** -- null safety for `clientStats` and `renterInsights`
4. **AIListingAssistant** -- `unknown` type cast for `generatedData` fields

---

## Fix 1: Toast Imports (3 files)

These files import `toast` from `'sonner'` directly, bypassing the compatibility wrapper that handles the old `toast({ title, description, variant })` syntax.

**Fix:** Change the import in each file from:
```typescript
import { toast } from 'sonner';
```
to:
```typescript
import { toast } from '@/components/ui/sonner';
```

### Files:
- `src/components/AccountSecurity.tsx` (line 9) -- 11 toast calls with old syntax
- `src/components/AuthDialog.tsx` (line 11) -- 14 toast calls with old syntax, some with JSX descriptions
- `src/components/AIListingAssistant.tsx` (line 11) -- fixes the `unknown` ReactNode error too since sonner's raw return type won't leak into JSX

---

## Fix 2: CascadeFilterButton.tsx Event Listener Type

Lines 84-99: The `handleClickOutside` function types its parameter as `MouseEvent` (DOM), but `addEventListener('touchstart', ...)` expects `EventListener` which takes `Event`, not `MouseEvent`.

**Fix:** Change the parameter type from `MouseEvent` to `Event` and cast `event.target` inside:
```typescript
const handleClickOutside = (event: Event) => {
  const target = event.target as Node;
  if (
    panelRef.current && !panelRef.current.contains(target) &&
    buttonRef.current && !buttonRef.current.contains(target)
  ) {
    setIsOpen(false);
  }
};
```

---

## Fix 3: ClientInsightsDialog.tsx Null Safety

`clientStats` and `renterInsights` are both computed via `useMemo` and return `null` when `profile` is absent. The template accesses their properties directly without null guards starting around line 389.

**Fix:** Add a null guard before the statistics section that uses these values. Wrap the Client Statistics block (lines 376-424) with `{clientStats && ( ... )}` and the Renter Readiness block (lines 428-540+) with `{renterInsights && ( ... )}`.

This is safe because both values are `null` only when `profile` is null, and the dialog shouldn't render these sections without a profile anyway.

---

## Summary

| File | Fix | Lines |
|------|-----|-------|
| `AccountSecurity.tsx` | Change toast import to wrapper | Line 9 |
| `AuthDialog.tsx` | Change toast import to wrapper | Line 11 |
| `AIListingAssistant.tsx` | Change toast import to wrapper | Line 11 |
| `CascadeFilterButton.tsx` | Change `MouseEvent` to `Event` | Lines 84-89 |
| `ClientInsightsDialog.tsx` | Add null guards around `clientStats` and `renterInsights` blocks | Lines 376-540 |

All fixes are minimal single-line or wrapping changes. No logic, layout, or functionality changes.

