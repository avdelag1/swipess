

## Fix Plan: Buttons Visibility, Logo Background, Radio Consolidation, Speed & Crash Fix

### Critical Bug: Infinite Recursion Crash (RadioContext)

The **"Maximum call stack size exceeded"** error is the #1 cause of the app feeling slow/broken. `play()` calls `changeStation('next')` synchronously when a station is in `failedStationsRef`, and `changeStation` calls `play()` back — creating infinite recursion when multiple stations fail.

**Fix**: Add a recursion depth counter ref. If `play()` is called more than 5 times in a row without success, stop and set an error state instead of continuing to recurse.

### Issue 1: Right-side action buttons (Save, Like, Chat) hidden behind nav bar

In `src/components/events/EventCard.tsx` line 185, the buttons are positioned at `bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))]`. The bottom nav bar is taller than this offset.

**Fix**: Increase the bottom offset to `bottom-[calc(9rem+env(safe-area-inset-bottom,0px))]` so buttons sit clearly above the navigation bar.

### Issue 2: Logo "S" watermark showing on all inner pages

In `src/components/DashboardLayout.tsx` line 524-527, there's a fixed full-screen SwipessLogo watermark at 10% opacity that shows on every page transition.

**Fix**: Remove the watermark `div` entirely from DashboardLayout. The logo on the landing page stays untouched.

### Issue 3: Radio button — keep ONLY in header

Currently radio appears in 3 places:
- **TopBar** (header) — line 444-464 — **KEEP this one**
- **BottomNavigation** — line 99 (client) and line 112 (owner) — **REMOVE**
- **ClientProfileNew** — line 294-306 — **REMOVE**
- **OwnerProfileNew** — line 190-202 — **REMOVE**

**Fix**: Delete the radio nav items from both client and owner arrays in BottomNavigation, and delete the radio buttons from both profile pages.

### Issue 4: Speed — page transitions feel 2-5 seconds

Root causes:
1. The infinite recursion crash in RadioContext is freezing the main thread
2. Heavy `AnimatePresence` + `motion.div` wrapping every nav item with spring physics

**Fixes**:
- Fix the RadioContext crash (primary cause)
- The `changeStation` useCallback depends on `play` which depends on `state.currentStation` — this causes the callback to be recreated on every station change, potentially causing stale closure issues. Pin it with refs.

### Files to Edit

| File | Change |
|---|---|
| `src/contexts/RadioContext.tsx` | Add recursion guard to `play()` to prevent infinite stack overflow |
| `src/components/events/EventCard.tsx` | Move right-side buttons higher (increase bottom offset) |
| `src/components/DashboardLayout.tsx` | Remove the SwipessLogo watermark div |
| `src/components/BottomNavigation.tsx` | Remove radio nav items from client and owner arrays |
| `src/pages/ClientProfileNew.tsx` | Remove radio button |
| `src/pages/OwnerProfileNew.tsx` | Remove radio button |

