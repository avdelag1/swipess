

## Fix Build Errors + Reorder Map UI + Tighten Card Frame + Notification Swipe

### 1. Fix Build Errors (TypeScript)

**`src/components/swipe/LocationRadiusSelector.tsx`** — add missing prop to interface:
```ts
onCategorySelect?: (cat: 'property'|'motorcycle'|'bicycle'|'services') => void;
```
Wires the corner category buttons that the containers already pass.

**`src/components/NotificationPopover.tsx` (line 80)** — `haptics.notification('success')` doesn't exist. Replace with `haptics.success()`.

**`src/components/NotificationSystem.tsx`** — type mismatch between zustand store `Notification` (timestamp: Date, type: NotificationType union) and `NotificationBar`'s local `Notification` (timestamp: string, type: string). Fix by importing the store's `Notification` type into `NotificationBar.tsx` and removing the local interface, OR by mapping `timestamp.toISOString()` in `NotificationSystem.tsx`. We'll unify: import the store type into `NotificationBar` and convert `current.timestamp` to string only where displayed.

### 2. Reorder Map Selector — KM on Top, Map Below

Current layout: map first → KM pills below. User wants the inverse + cleaner.

In `LocationRadiusSelector.tsx`:
- Move the **KM pill scroller to the TOP** (above the map) — same horizontal snap-scroll, slim glass bar.
- Map sits below as the dominant visual.
- Remove the gradient overlay text/labels — keep icons only.
- Add a **back/close icon** in top-left corner of the map (calls a new optional `onClose` prop, falls back to clearing the active category via `setActiveCategory(null)`).
- Keep GPS button bottom-right, +/- zoom bottom-left, category quick-filters as floating corner icons (no labels).
- Remove redundant text elsewhere: the "Searching candidates in Xkm" badge in `SwipessSwipeContainer.tsx` (lines 982–1011) duplicates info already shown by the map. Delete that whole searching badge block.

### 3. Remove the "Frame Line" Below Cards

The faint hairline under the rounded card corners in `PokerCategoryCard.tsx` comes from the second shadow layer `0 20px 40px -12px rgba(0,0,0,0.45)` which casts a visible band below the card. Soften it:
```
boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
```
Drop the second layer entirely. Same fix applied to `SimpleSwipeCard.tsx` and `SimpleOwnerSwipeCard.tsx` non-top "GLASS PEEK" placeholder which uses `shadow-sm` — change to no shadow (keep only the subtle 1px border).

### 4. Adaptive Card Sizing — Header to Nav, No Overlap

Cards must fill the space between the TopBar and BottomNavigation on every device, with small breathing room and no overlap. In `OwnerAllDashboard.tsx` and the card containers in `SwipessSwipeContainer.tsx` / `ClientSwipeContainer.tsx`:

```ts
style={{
  width: 'min(94vw, 520px)',
  height: 'min(calc(100dvh - var(--top-offset, 88px) - var(--bottom-offset, 96px)), 760px)',
}}
```

Use `100dvh` (dynamic viewport height) so iOS Safari URL bar collapse doesn't break it. Add `--top-offset` and `--bottom-offset` CSS vars on `:root` in `index.css` so all devices share one source of truth.

### 5. Smoother Card Transitions

In `SimpleSwipeCard.tsx` and `SimpleOwnerSwipeCard.tsx`, the next-card placeholder fades in jarringly. Wrap the placeholder render in `AnimatePresence` (already used at parent) and ensure the top card's exit uses the same spring (`PK_SPRING`) used for entry — eliminates the snap. Also preload next 2 images via the existing `imagePreloadController` in the same effect that triggers when `currentIndex` changes (already done in containers — verify it fires on every advance).

### 6. Notification Bar Swipe-to-Dismiss

`NotificationBar.tsx` already supports drag — but `dragConstraints={{ left: 0, right: 0 }}` clamps movement to zero. Change to `{ left: -200, right: 200 }` so the user can actually drag, and lower the threshold to 60px. Also add `dragElastic={0.4}` for natural rubber-band. This makes both swipe-left and swipe-right visibly dismiss the toast.

### Files Modified

| File | Change |
|------|--------|
| `src/components/swipe/LocationRadiusSelector.tsx` | Add `onCategorySelect` to props; move KM pills to top; add back icon; remove text |
| `src/components/NotificationPopover.tsx` | `haptics.notification('success')` → `haptics.success()` |
| `src/components/NotificationBar.tsx` | Import store `Notification` type; widen drag constraints; lower swipe threshold |
| `src/components/NotificationSystem.tsx` | Type alignment with store |
| `src/components/swipe/PokerCategoryCard.tsx` | Soften shadow — remove bottom band |
| `src/components/SimpleSwipeCard.tsx` | Remove `shadow-sm` from non-top peek; sync exit spring |
| `src/components/SimpleOwnerSwipeCard.tsx` | Same as above |
| `src/components/swipe/OwnerAllDashboard.tsx` | Fluid sizing using dvh + offset vars |
| `src/components/SwipessSwipeContainer.tsx` | Delete redundant "Searching candidates" badge; fluid card sizing |
| `src/components/ClientSwipeContainer.tsx` | Fluid card sizing |
| `src/index.css` | Add `--top-offset` / `--bottom-offset` CSS vars |

