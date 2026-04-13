

# Fix Radio Buttons, Filter Colors, AI Knowledge Priority, and Swipe Cards

## Issues Identified

1. **Radio top bar buttons overlapping** — The shuffle and list music buttons in the top-right are `w-10 h-10` each with only `gap-2` (8px) spacing, causing visual crowding on smaller screens
2. **Filter accent colors not carrying through to new pages** — Category accent colors defined in `SwipeConstants.ts` are not applied to downstream discovery pages after selection
3. **AI concierge internal knowledge priority** — The edge function already has `searchPromotedContacts` with a +10 score boost for promoted tags, but need to verify it's always called before web search and results are injected prominently into the system prompt
4. **Swipe quick-filter cards not landing well** — The poker card stack on both client (`SwipeAllDashboard`) and owner (`OwnerAllDashboard`) side needs visual refinement for a premium first impression

---

## Plan

### 1. Fix Radio Top Bar Button Overlap

**File**: `src/pages/DJTurntableRadio.tsx`

- Reduce top-right buttons from `w-10 h-10` to `w-9 h-9`
- Reduce icon sizes from `w-4 h-4` / `w-5 h-5` to `w-3.5 h-3.5` / `w-4.5 h-4.5`
- Also reduce back button from `w-10 h-10` to `w-9 h-9`
- Keep `gap-2` spacing — smaller buttons solve the overlap

### 2. Ensure Filter Colors Match Across Pages

**Files**: `src/components/swipe/SwipeConstants.ts`, relevant discovery headers

- Each category already has an `accent` color defined in `POKER_CARDS` and `OWNER_INTENT_CARDS`
- Pipe the active category's accent color into the filter store or pass it via the existing `activeCategory` state so downstream components (headers, badges, active states) can read it
- Add `accentColor` field to `FilterState` in `filterStore.ts`
- Set it automatically when `setCategories` is called, looking up from the constants
- Use this accent in discovery header active states and filter pills

### 3. Strengthen AI Internal Knowledge Priority

**File**: `supabase/functions/ai-concierge/index.ts`

The edge function already has good knowledge search and promoted contact detection. Improvements:
- Always run `searchKnowledge` AND `searchPromotedContacts` on every query (not just when `detectPromotedContactIntent` returns true) — this ensures internal data is always checked
- In the system prompt injection, label internal results as **"VERIFIED LOCAL INFORMATION — ALWAYS PRESENT THESE FIRST"** so the AI model knows to prioritize them over web results
- Only fall back to `searchWeb` (Tavily) when internal knowledge returns empty

### 4. Polish Swipe Quick-Filter Cards

**Files**: `src/components/swipe/PokerCategoryCard.tsx`, `src/components/swipe/SwipeAllDashboard.tsx`, `src/components/swipe/OwnerAllDashboard.tsx`

- **Card height**: Ensure cards don't overflow the viewport — use `min(500px, calc(100vh - 280px))` for dynamic sizing
- **Stack offset**: Reduce `stackY` from `index * 18` to `index * 12` for tighter, more premium stacking
- **Border radius**: Keep `rounded-[48px]` — already premium
- **Button label**: The "Launch X" button is good but ensure it has enough bottom padding on shorter screens
- **Chevron arrows**: Make theme-aware — currently hardcoded `text-white/60` and `bg-white/5` which looks wrong in light mode. Use semantic tokens
- **Light mode fix**: Both dashboards use `text-white/60` for arrows — needs to be `text-foreground/60` and `bg-foreground/5` for theme awareness

### Files Modified

| File | Change |
|---|---|
| `src/pages/DJTurntableRadio.tsx` | Shrink top bar buttons |
| `src/state/filterStore.ts` | Add `accentColor` to state |
| `src/components/swipe/SwipeAllDashboard.tsx` | Theme-aware arrows, dynamic card height |
| `src/components/swipe/OwnerAllDashboard.tsx` | Theme-aware arrows, dynamic card height |
| `src/components/swipe/PokerCategoryCard.tsx` | Tighter stack, responsive height |
| `supabase/functions/ai-concierge/index.ts` | Always search internal knowledge first |

