

## Fix Swipe Cards, ID Card & Runtime Errors

### Problems Identified

1. **Swipe card sizing on mobile**: The card container uses `calc(100vh - 160px)` for height, which on a 676px viewport = 516px. Combined with the 48px rounded corners, the card looks oversized and awkward. The bottom area has too much empty space below the card stack.
2. **Swipe sensitivity too aggressive**: Threshold of 25px / 150 velocity means accidental micro-drags trigger card cycling — feels broken and uncontrollable.
3. **ID Card modal**: The close button at `-top-11` can overlap with status bar. Card padding and layout need tightening for mobile.
4. **Runtime errors**: `useNavigate()` outside Router in `NotificationSystem` and `useState` null in `WelcomeBonusModal` — these cause crashes and error boundary recovery loops.

### Plan

**1. Fix runtime errors (silent fixes)**

- `NotificationSystem.tsx` / `useNotificationSystem.tsx`: Wrap the `useNavigate` call in a try-catch or guard it so it doesn't crash outside Router context.
- `WelcomeBonusModal.tsx`: Fix the `useState` null error — likely a lazy-loaded component mounting issue. Wrap in error boundary or add a guard.

**2. Improve PokerCategoryCard swipe feel**

- Increase drag threshold from 25px to **60px** and velocity from 150 to **350** — prevents accidental cycles, makes swipes feel intentional.
- Reduce `dragElastic` from 0.35 to **0.25** for tighter resistance.
- Reduce rounded corners from `rounded-[48px]` to `rounded-[28px]` — 48px is excessive on mobile and wastes visible card area.
- Reduce `dragTilt` rotation range from [-12, 12] to [-8, 8] for subtlety.
- Tighten exit animation: exit at 280px instead of 320px for faster completion.

**3. Fix card stack container sizing**

- In both `SwipeAllDashboard.tsx` and `OwnerAllDashboard.tsx`: Change height from `calc(100vh - 160px)` to `calc(100vh - 220px)` to account for top bar + bottom nav + breathing room.
- Reduce `PK_W` from 360 to 340 and ensure the `calc(100vw - 120px)` works well on 393px width (= 273px, too narrow). Change to `calc(100vw - 80px)` for wider cards.

**4. Polish ID Card modal**

- Move close button from `-top-11` to inside the card top-right corner with `absolute top-3 right-3`.
- Add `overscroll-contain` to prevent background scroll bleed.

### Files to modify

- `src/components/swipe/PokerCategoryCard.tsx` — swipe physics, border radius, drag feel
- `src/components/swipe/SwipeAllDashboard.tsx` — container sizing
- `src/components/swipe/OwnerAllDashboard.tsx` — container sizing
- `src/components/swipe/SwipeConstants.ts` — PK_W adjustment
- `src/components/VapIdCardModal.tsx` — close button positioning
- `src/hooks/useNotificationSystem.tsx` — fix useNavigate crash
- `src/components/WelcomeBonusModal.tsx` — fix useState null crash

