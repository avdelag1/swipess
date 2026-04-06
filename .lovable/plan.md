

# Fix ModeSwitcher Icons + Legal Services Title

## Issues Found

1. **ModeSwitcher icon**: `Building2` (building icon) is confusing for "Owner" mode. User wants two person-shaped icons — one for client, one for owner. Icons also not perfectly centered due to `gap-3` being too wide for the pill width.

2. **Legal Services page title**: Says "What's Your Issue?" — sounds aggressive/confusing. Should be softer like "How Can We Help?" or "Select Your Legal Need".

3. **`/servics` 404**: This was a user typo in the URL bar — no broken link in the app. The correct route `/client/services` exists and works.

## Changes

### 1. ModeSwitcher — Replace Building2 with UserCheck icon
**File:** `src/components/ModeSwitcher.tsx`

- Replace `Building2` import with `UserCheck` (or `UserCog`) — a person icon with a checkmark, clearly distinguishable from the plain `User` icon but still person-shaped
- Reduce `gap-3` to `gap-2` for tighter centering
- Adjust the sliding highlight positioning to match the tighter gap
- Keep everything else (colors, pill shape, transitions) the same

### 2. Legal Services title cleanup
**File:** `src/pages/ClientLawyerServices.tsx`

- Change "What's Your Issue?" → "How Can We Help?"
- Change "Select the category that best describes your problem" → "Select the category that best describes your situation"

## Files Changed

| File | Change |
|------|--------|
| `src/components/ModeSwitcher.tsx` | Replace `Building2` with `UserCheck`, tighten icon gap for better centering |
| `src/pages/ClientLawyerServices.tsx` | Soften title text |

