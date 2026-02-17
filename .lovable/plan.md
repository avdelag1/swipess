
## Fix: Cinematic Swipe-to-Open Auth Flow

### Root Cause of the Freeze/Snap-Back

The current implementation has **two bugs** that cause the jarring freeze and snap-back:

1. **`x.set(0)` fires immediately in `handleDragEnd`** — before the auth dialog opens. This causes the logo to visibly snap back to center right before the dialog appears, creating the "freeze / comes back" effect the user sees.

2. **AuthDialog is a Radix `Dialog` overlay** — it appears on top of the landing page. The landing page (with the logo) stays mounted underneath. So the swipe completes, the logo snaps to center, then the dialog fades in on top — which looks broken.

3. **`dragMomentum={false}`** kills all natural feel. The card just stops dead, with no throw energy.

---

### The Vision: What It Should Look Like

```text
User swipes right →
  Logo accelerates to the right, fading and shrinking →
  The ENTIRE landing page vanishes (like turning a page) →
  Auth screen slides in from the right seamlessly →
  If user taps "Back", auth slides out and landing page returns
```

This is a **full-page transition**, NOT a dialog overlay on top of the landing page.

---

### Solution: Replace AuthDialog popup with a full-page auth panel

**The entire LegendaryLandingPage will be rebuilt** to handle two states:
- `landing` — the swipeable logo screen
- `auth` — the full auth form

Both states live in the same component. The transition between them is an **AnimatePresence** page-swap animation.

**No more Radix Dialog. No more overlay. Pure framer-motion page transition.**

---

### Implementation Plan

**File: `src/components/LegendaryLandingPage.tsx`**

Replace the entire component with a two-state design:

**State 1: Landing** — the logo page (current)  
**State 2: Auth** — the full auth form rendered inline (not in a Dialog)

The swipe mechanic:
- `dragMomentum={true}` — re-enable natural throw physics
- On drag end with `offset.x > 80` OR `velocity.x > 400` → trigger transition
- **Do NOT snap back** — instead animate the logo **off-screen to the right** using `x.set(window.innerWidth)` then trigger state change
- `AnimatePresence mode="wait"` controls the page swap: landing exits right → auth enters from right

The auth form (extracted from `AuthDialog.tsx`):
- Same form fields, Google OAuth button, everything
- Rendered as a full-screen dark panel
- "Back" button triggers reverse transition: auth exits right → landing re-enters from left

**Transition choreography:**

```
Landing exit:
  - Logo: x → +150vw, opacity → 0, blur → 20px (200ms)
  - Tagline + chips: opacity → 0, y → -20 (150ms, staggered)
  
Auth enter:
  - Full panel: x from +30px → 0, opacity 0 → 1, blur 8px → 0 (300ms ease-out)
  - Form elements stagger in from bottom (0.04s each)
  
Auth exit (back):
  - Panel: x → +30px, opacity → 0 (200ms)
  
Landing re-enter:
  - Logo: x from -50px → 0, opacity → 1 (300ms spring)
```

---

### Files to Edit

**1. `src/components/LegendaryLandingPage.tsx`** — Full rewrite of the component:
- Add `view: 'landing' | 'auth'` state
- Inline the auth form content (same logic from AuthDialog) 
- Remove `<AuthDialog>` import
- Proper AnimatePresence page swap
- Fix swipe: no snap-back, velocity-aware trigger, momentum enabled
- Swipe hint arrow under the logo (subtle, animated left→right bounce)

**2. `src/components/AuthDialog.tsx`** — No changes needed (it's still used elsewhere in the app — e.g. from owner flow). We just won't use it on the landing page anymore.

---

### Swipe Physics Fix

Current (broken):
```ts
dragMomentum={false}         // kills natural feel
dragElastic={0.9}            // too elastic, causes snap-back perception
x.set(0)                     // fires immediately → visible snap
```

Fixed:
```ts
dragMomentum={true}          // natural throw feel
dragElastic={0.15}           // tighter, less bounce
// on drag end, if threshold met:
//   animate x to +200vw THEN show auth view
//   never call x.set(0) until landing view is already hidden
```

Trigger condition:
```ts
info.offset.x > 80 || info.velocity.x > 400
```

---

### Visual Result

The user will experience:

1. **Swipe right** → logo flies off-screen to the right with blur trail
2. **Auth panel** slides in smoothly from slight right offset, all form elements cascade in
3. **Tap "Back"** → auth fades out, logo swoops back in from left
4. **Tap the logo** → same instant transition (no swipe needed)

Cinematic. Zero freeze. Zero snap-back. Premium flagship feel.
