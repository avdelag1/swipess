# Directive: Nexus Aesthetic Unification

## Objective
Enforce a consistent, high-fidelity "Nexus" design language across all Swipess modules, purging all legacy green/orange/blue artifacts.

## Design Standards
- **Palette**: Strictly use Rose (`#EB4898`), Violet (`#8B5CF6`), and Indigo (`#6366F1`).
- **Glassmorphism**: 32px blur, 220% saturation, 0.06 opacity borders.
- **Micro-Animations**: Use opacity pulses and spring-based tactile feedback for all primary interactions.

## Critical Checks
- **Purge Audit**: Search for `emerald-500`, `amber-500`, and legacy `blue-500` references.
- **Role Parity**: Ensure Client (Rose) and Owner (Violet) modes maintain aesthetic consistency while remaining distinct.
- **Production Integrity**: Run `npm run build` before every push to ensure zero syntax or layout regressions.

## Learnings (2026-05-03)
- WhatsApp buttons should maintain rose shadows even if the button itself uses the iconic green.
- Premium CTAs in messaging increase "WOW" factor when using animated pulses.
- `filters.ts` is the source of truth for category color mapping.
