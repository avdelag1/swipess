

## Plan: Professional Polish — Header Consistency, Profile/Listing Fixes, AI Chat Redesign

### Issues Identified

1. **TopBar buttons inconsistent sizes** — ThemeToggle is `h-7 w-7` while Token and Notification buttons are `h-9 w-9`. Avatar is `h-8 w-8`. Back button is `w-8 h-8`. They should all match.

2. **Profile creation works** — The save flow looks correct (photo required, upsert to `client_profiles`). Need to verify `useSaveClientProfile` handles missing rows gracefully (upsert vs insert). Will check for common errors.

3. **Listing creation has hardcoded dark styles** — `UnifiedListingForm` uses `bg-zinc-900/30`, `border-white/5`, `bg-zinc-900/40` extensively. These look broken in light mode.

4. **AI Chat dialog opens awkwardly** — Currently uses a standard Dialog with `[&]:top-[55%]` positioning. No entrance animation beyond default. The input area and overall feel are plain.

5. **Sign-up/Sign-in flow** — Already exists; need to verify it works. No changes needed unless there are actual errors.

---

### Changes

#### 1. Standardize all TopBar button sizes (3 files)

**`src/components/ThemeToggle.tsx`**
- Change `h-7 w-7 sm:h-8 sm:w-8` → `h-9 w-9` to match Token and Notification buttons
- Add `rounded-xl` and glass styling consistent with other TopBar buttons

**`src/components/TopBar.tsx`**
- Avatar: change `h-8 w-8 sm:h-10 sm:w-10` → `h-9 w-9` for consistency
- Back button: change `w-8 h-8` → `w-9 h-9`

#### 2. Fix UnifiedListingForm light-mode styling

**`src/components/UnifiedListingForm.tsx`**
- Replace hardcoded `bg-zinc-900/30 border-white/5` on Card components with semantic `bg-card border-border`
- Replace `border-white/10` dashed upload border with `border-border`
- Replace `border-white/[0.06]` footer border with `border-border`
- Replace `bg-white/[0.04]` hover with theme-aware alternative
- The vehicle info box `bg-zinc-900/40 border-white/5` → `bg-muted/50 border-border`

#### 3. Redesign AI Chat Dialog with premium feel

**`src/components/AISearchDialog.tsx`**
- Add a smooth slide-up + scale entrance animation using framer-motion on the DialogContent
- Redesign the input area: add a frosted glass pill with inner glow effect, subtle gradient border
- Add a subtle ambient glow behind the AI avatar icon
- Make the message bubbles have softer corners and subtle shadows
- Add a cool "frost shimmer" effect on the chat container background using CSS
- The dialog currently has `[&]:top-[55%]` — change to proper centered positioning with a slide-up animation

#### 4. Verify profile save works (investigate + fix if needed)

**`src/hooks/useClientProfile.ts`**  
- Check the save mutation for proper upsert logic — ensure it handles both new profiles (no row yet) and updates
- The `resolveAuthenticatedUserId` function already has retry logic, which is good

---

### Files to Edit (4 files)

| File | Change |
|------|--------|
| `ThemeToggle.tsx` | Match h-9 w-9 + rounded-xl styling |
| `TopBar.tsx` | Standardize avatar and back button to h-9 w-9 |
| `UnifiedListingForm.tsx` | Replace hardcoded dark styles with semantic tokens |
| `AISearchDialog.tsx` | Add slide-up animation, redesign input with frost effect, polish bubbles |

