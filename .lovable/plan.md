

## Fix Filter Title Icon + Fix Zoom Panning on Client Swipe Cards

### Issue 1: Remove emoji icons from filter title in top bar

The top-left corner title currently shows emojis like "🏠 Properties", "🏍️ Motorcycles". Remove the emoji prefixes so it just shows plain text: "Properties", "Motorcycles", etc.

**File: `src/components/DashboardLayout.tsx`** (lines 500-520)

Change the category/client type label maps to remove emoji prefixes:
- `'🏠 Properties'` becomes `'Properties'`
- `'🏍️ Motorcycles'` becomes `'Motorcycles'`  
- `'🚲 Bicycles'` becomes `'Bicycles'`
- `'💼 Services'` becomes `'Workers'`
- Same for owner-side labels: `'🏠 Property Seekers'` becomes `'Property Seekers'`, etc.

---

### Issue 2: Zoom activates but panning doesn't work on client swipe cards

**Root cause**: Framer-motion's `drag` prop automatically attaches internal pointer listeners to the `motion.div`. When the user holds their finger down, framer-motion captures the pointer events for drag tracking. Even though the magnifier's `onPointerMove` handler is on an inner div, framer-motion's internal system intercepts subsequent pointer move events after drag detection starts, so the magnifier never receives the move events needed for panning.

The current `drag={!magnifierActive}` approach doesn't work because:
1. At pointer-down time, `magnifierActive` is `false` (the 350ms timer hasn't fired yet)
2. Framer-motion starts tracking drag immediately
3. By the time magnifier activates (350ms later), framer-motion already owns the pointer

**Fix**: Use `useDragControls` from framer-motion with `dragListener={false}`. This prevents framer-motion from auto-attaching pointer listeners. Instead, we manually decide when to start a drag:

- On `onPointerDown`: start the magnifier's hold timer AND store the event
- On `onPointerMove`: if movement > 15px before 350ms, manually call `dragControls.start(storedEvent)` to begin swiping
- If 350ms passes without significant movement, magnifier activates -- drag is never started, so panning works freely
- On `onPointerUp`: deactivate magnifier if active

**File: `src/components/SimpleSwipeCard.tsx`**

Changes:
1. Import `useDragControls` from framer-motion
2. Create `const dragControls = useDragControls()`
3. Set `dragListener={false}` on the `motion.div` -- framer-motion will NOT auto-listen for drag
4. Add `dragControls={dragControls}` to the `motion.div`
5. Create a unified `onPointerDown` handler on the outer motion.div that:
   - Stores the pointer event
   - Starts the magnifier hold timer
6. Create a unified `onPointerMove` handler that:
   - If magnifier is active: delegate to magnifier's pan handler
   - If hold timer is pending and movement > 15px: cancel hold timer, call `dragControls.start(storedEvent)` to begin drag
   - If hold timer is pending and movement < 15px: do nothing (wait for hold to complete)
7. On `onPointerUp`: deactivate magnifier, end drag

**File: `src/components/SimpleOwnerSwipeCard.tsx`**

Apply the same `useDragControls` pattern for consistency, even though the owner side was reported as working (ensures both sides use the same robust gesture separation).

### Technical flow

```text
Pointer Down
    |
    v
Start 350ms hold timer
    |
    +-- Movement > 15px before timer? --> Cancel timer, start drag via dragControls.start()
    |
    +-- Timer fires (no big movement)? --> Activate magnifier, panning works freely
    |
    +-- Pointer Up before either? --> Cancel timer, no action (tap)
```

### Files modified
1. `src/components/DashboardLayout.tsx` -- Remove emoji icons from title labels
2. `src/components/SimpleSwipeCard.tsx` -- Use useDragControls for manual gesture control
3. `src/components/SimpleOwnerSwipeCard.tsx` -- Same useDragControls pattern
