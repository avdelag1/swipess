

# Responsive Font Scaling for Card Info Overlays

## What

Replace all fixed Tailwind text sizes (`text-2xl`, `text-base`, `text-sm`, `text-lg`) in `CardInfoHierarchy.tsx` with `clamp()`-based inline `fontSize` styles that scale fluidly between small and large screens.

## Scaling Map

| Element | Current | New (clamp) |
|---------|---------|-------------|
| Price / headline | `text-2xl` (24px) | `clamp(1.125rem, 4.5vw, 1.5rem)` — 18px → 24px |
| Secondary headline | `text-lg` (18px) | `clamp(1rem, 3.5vw, 1.125rem)` — 16px → 18px |
| Supporting text | `text-base` (16px) | `clamp(0.8125rem, 3vw, 1rem)` — 13px → 16px |
| Metadata / labels | `text-sm` (14px) | `clamp(0.6875rem, 2.5vw, 0.875rem)` — 11px → 14px |
| Icon sizes | `w-5 h-5` / `w-4 h-4` | Keep Tailwind classes (icons don't need fluid scaling) |

## File: `src/components/ui/CardInfoHierarchy.tsx`

All three card info components (`PropertyCardInfo`, `VehicleCardInfo`, `ServiceCardInfo`, `ClientCardInfo`) get the same treatment:

- Replace `className="text-2xl font-bold ..."` with `style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.5rem)' }}` + keep `font-bold text-white drop-shadow-lg` in className
- Replace `text-lg` spans with inline `fontSize: 'clamp(1rem, 3.5vw, 1.125rem)'`
- Replace `text-base` spans with inline `fontSize: 'clamp(0.8125rem, 3vw, 1rem)'`
- Replace `text-sm` spans with inline `fontSize: 'clamp(0.6875rem, 2.5vw, 0.875rem)'`

No other files need changes — all card info rendering flows through this single component file.

