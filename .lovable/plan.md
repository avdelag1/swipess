# Fix Landing Page Input Visibility

The Sign In / Sign Up input fields (Email, Password, Your Name, Confirm Password) currently render nearly black on the black background — placeholders and typed text are barely visible in the screenshots. The previous polish pass over-darkened them.

## What to change

**File:** `src/components/LegendaryLandingPage.tsx` (the `inputCls` helper, ~line 278)

Rebalance the input surface so it reads clearly on pure black while keeping the premium dark feel:

- Background: `bg-white/[0.08]` → `bg-white/[0.14]` (lifts surface off black)
- Border: `border-white/15` → `border-white/25` (defines edge)
- Placeholder: `placeholder:text-white/55` → `placeholder:text-white/75` (legible)
- Input text color: keep `text-white` but ensure font is readable — drop `font-bold` to `font-semibold` and bump size from `text-sm` to `text-[15px]`
- Focus state: keep red ring, raise focus bg to `bg-white/[0.18]` and border to `border-[#E01E2A]`
- Add a subtle inner highlight: `shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]` for depth

## Eye / password toggle icon

The eye icon on the password fields currently uses faint white. Bump it to `text-white/70 hover:text-white` so it's visible.

## Result

```text
Before: ▓ near-black pill, placeholder barely visible
After:  ░ clearly elevated dark-glass pill, white/75 placeholder, white text
```

No layout, spacing, or component changes. No structural edits. Brand red (#E01E2A) primary buttons stay exactly as-is — this only fixes the input legibility problem shown in the screenshots.
