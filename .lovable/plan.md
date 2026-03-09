

# Round 3: Remaining Performance Drains

There are still several active performance killers hiding in the codebase. Here's what's left.

---

## 1. Delete Dead Files: `FireOrb.tsx`, `CheetahBackground.tsx`, `DepthParallaxBackground.tsx`

All three are **no longer imported anywhere** but still exist as 349, 165, and 144 lines of dead code respectively. `DepthParallaxBackground` is explicitly commented out in `App.tsx`. Clean deletion — zero risk.

**Also delete:** `src/state/parallaxStore.ts` (only used by DepthParallaxBackground).

---

## 2. TutorialSwipePage: 20+ `backdropFilter: blur()` layers

`TutorialSwipePage.tsx` is the single worst offender remaining — it has **20+ inline `backdropFilter: blur()`** calls on badges, overlays, buttons, and cards. Every single one forces a GPU blur composite.

**Action:** Replace all `backdropFilter: blur()` with solid semi-opaque backgrounds (`rgba(0,0,0,0.7)` etc). Same visual on dark UI, massive GPU savings.

---

## 3. RadarSearchEffect: `filter: blur(40px)` glow layer

The "sentient glow" layer uses `filter: blur(40px)` on a div that scales 1→1.3→1 infinitely. This runs on the empty-state screen (when no cards remain). A 40px blur re-composited every frame is expensive.

**Action:** Replace with a static CSS `box-shadow` glow. Same visual, zero per-frame cost.

---

## 4. NotificationBar: still has `backdropFilter: blur(24px)`

Missed in the previous pass. Every notification triggers a blur composite.

**Action:** Replace with solid background.

---

## 5. MessagingInterface: 2x `backdropFilter: blur(20px)`

The message header and input area both use blur. These are visible during every chat interaction.

**Action:** Replace with `hsl(var(--background) / 0.97)` solid — already nearly opaque so blur adds nothing visible.

---

## 6. SimpleOwnerSwipeCard: 3x `backdropFilter: blur(8px)`

Info badges on owner swipe cards each have blur. During swiping these are on the active card being dragged — blur re-renders on every drag frame.

**Action:** Replace with solid dark backgrounds.

---

## 7. QuickFilterDropdown: `backdropFilter: blur(8px)`

Filter button uses blur. Static element, easy swap.

---

## Summary

| Target | Blur Layers Killed | Type |
|--------|-------------------|------|
| Dead files (3 files + store) | 0 (dead code cleanup) | Bundle size |
| TutorialSwipePage | ~20 | GPU shader |
| RadarSearchEffect | 1 (40px!) | GPU shader + animation |
| NotificationBar | 1 | GPU shader |
| MessagingInterface | 2 | GPU shader |
| SimpleOwnerSwipeCard | 3 | GPU shader (on dragged card!) |
| QuickFilterDropdown | 1 | GPU shader |

**Files to delete:** `FireOrb.tsx`, `CheetahBackground.tsx`, `DepthParallaxBackground.tsx`, `parallaxStore.ts`

**Files to edit:** `TutorialSwipePage.tsx`, `RadarSearchEffect.tsx`, `NotificationBar.tsx`, `MessagingInterface.tsx`, `SimpleOwnerSwipeCard.tsx`, `QuickFilterDropdown.tsx`

This eliminates the last ~28 hidden blur layers and removes ~800 lines of dead code from the bundle.

