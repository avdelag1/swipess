

## Plan: Fix Build Errors

Three simple fixes to resolve the build errors blocking the app:

### 1. Add missing `cn` import in NotificationsDialog.tsx
**File:** `src/components/NotificationsDialog.tsx`
- Add `import { cn } from '@/lib/utils';` to the imports

### 2. Add missing `useTheme` import in NotificationsPage.tsx
**File:** `src/pages/NotificationsPage.tsx`
- Add `import { useTheme } from '@/hooks/useTheme';` to the imports

### 3. Add missing city keys in StationDrawer.tsx
**File:** `src/components/radio/retro/StationDrawer.tsx`
- Add `'jazz': 'JZ'` and `'reggae': 'RG'` to the `CITY_ICONS` record (lines 19-29)

### AI Status
The AI functionality is already configured — the project has `LOVABLE_API_KEY` set up as a secret and uses Lovable AI through the `ai-orchestrator` edge function. No additional API key is needed. The AI chat and search features should work once the app builds successfully.

