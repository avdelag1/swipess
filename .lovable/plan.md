

## Fix Plan: Scroll Issues, Filter Headers, Likes Freeze, VAP Card + Profile Verification

### Problems Identified

1. **Owner Discovery (filter page)**: The entire header section (title "Prospect Shield / Target Acquisition", tabs, category buttons, search) is `sticky top-0` — it stays fixed while content scrolls behind it, causing overlap. Needs to scroll with the page.

2. **Client Worker Discovery (filter page)**: Same issue — the header with "Discovery / Services" and filter pills is `sticky top-0`, overlapping scrolled content.

3. **Likes pages frozen (both sides)**: `ClientLikedProperties` and `LikedClients` both use `h-full min-h-0 overflow-y-auto` creating a nested scroll container inside the DashboardLayout scroll container. Since DashboardLayout already owns scroll via `#dashboard-scroll-container`, these inner scroll containers conflict and freeze. Fix: switch to `min-h-full overflow-visible` per the unified scroll flow policy.

4. **VAP Card opens briefly then closes**: Likely a re-render or state issue. Need to inspect the trigger in ClientProfile.

5. **Profile needs more verification fields**: Add `occupation`, `years_in_city` to `client_profiles` table. Expand the profile editing dialog and the VAP card to show these. Build a verification completeness score.

---

### Plan

#### 1. Make filter page headers scroll with content

**OwnerDiscovery.tsx** (line 105):
- Remove `sticky top-0 z-40` from the header wrapper div
- Content will now scroll naturally as one page

**ClientWorkerDiscovery.tsx** (line 116):
- Same fix: remove `sticky top-0 z-40` from the header div
- Remove the separate `overflow-y-auto h-[calc(100vh-120px)]` on the content div — let DashboardLayout handle scroll

#### 2. Fix frozen Likes pages

**ClientLikedProperties.tsx** (line 193-196):
- Change `h-full min-h-0 overflow-y-auto` to `min-h-full overflow-visible`
- Remove `overscrollBehavior` and `WebkitOverflowScrolling` styles (parent handles this)

**LikedClients.tsx** (line 191):
- Same fix: change `h-full min-h-0 overflow-y-auto` to `min-h-full overflow-visible`

#### 3. Fix VAP Card closing immediately

Inspect the modal trigger in ClientProfile and ensure the state toggle isn't being re-triggered by a parent re-render or touch event bubbling.

#### 4. Add profile verification fields (DB migration)

Add columns to `client_profiles`:
- `occupation TEXT`
- `years_in_city INTEGER`
- `employer_name TEXT`

#### 5. Expand profile editing + VAP card

**ClientProfileDialog** — add occupation, years_in_city fields to the edit form

**VapIdCardModal** — show occupation, years_in_city, and calculate a verification completeness percentage (documents uploaded + fields filled) displayed as a progress ring on the card

**useClientProfile hook** — add new fields to the type and sync logic

#### 6. Build verification

TypeScript build check to catch regressions.

---

### Files to modify

| File | Change |
|------|--------|
| `src/pages/OwnerDiscovery.tsx` | Remove sticky header |
| `src/pages/ClientWorkerDiscovery.tsx` | Remove sticky header, remove inner scroll |
| `src/pages/ClientLikedProperties.tsx` | Fix scroll: `min-h-full overflow-visible` |
| `src/components/LikedClients.tsx` | Fix scroll: `min-h-full overflow-visible` |
| `src/components/VapIdCardModal.tsx` | Add verification fields display + completeness score |
| `src/pages/ClientProfile.tsx` | Fix VAP modal state |
| `src/components/ClientProfileDialog.tsx` | Add occupation, years_in_city inputs |
| `src/hooks/useClientProfile.ts` | Add new fields to type |
| **DB Migration** | Add `occupation`, `years_in_city`, `employer_name` to `client_profiles` |

