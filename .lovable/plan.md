## Goal

Make the app feel bulletproof to end users: never show a raw "Something went wrong" page, auto-recover instead. Then polish the AI Concierge chat (input field, Enter/Send button, Start Session button) so the controls are clearly visible and feel premium.

---

## 1. Silent self-healing — no more error pages

**`src/components/GlobalErrorBoundary.tsx`**
- Remove the visible "Something went wrong" UI (icon, title, error message box, Try Again / Go Home / Copy Details buttons).
- On any caught render error: silently `window.location.reload()` after a 600ms delay so the splash paints first.
- Rate-limit reloads to **3 per minute** via `sessionStorage` to prevent infinite reload loops. If the limit is exceeded, fall back to a minimal, branded "Reconnecting…" splash with a subtle spinner — no error text, no buttons.
- Keep error logging via `logger.error` (devs still see it in console / logs).
- Keep existing chunk-load auto-reload behavior (already implemented in `main.tsx`).

This means: any runtime crash → app silently reloads itself → user sees at most a half-second splash. If something is genuinely broken in a loop, they see a clean "Reconnecting…" spinner instead of a scary error screen.

---

## 2. AI Concierge chat — control visibility & polish

**`src/components/ConciergeChat.tsx` — Privacy Portal ("Start Session" button, line ~115)**
- Rework the accept button so it reads as a clearly tappable primary CTA on both Swipess (black) and standard themes:
  - Solid `bg-primary` fill, `text-primary-foreground`, larger label, stronger shadow ring, subtle gradient sheen.
  - Add a small chevron/arrow icon to the right so its purpose is obvious.

**Chat input area (line ~792–833)**
- Increase contrast of the input container border so the field is clearly framed (use `border-foreground/15` in light, `border-white/15` in dark instead of the very faint `border-white/10`).
- Make the textarea text color explicit: `text-foreground` in light, `text-white` in Swipess/dark — and lift the placeholder opacity (was too washed out).
- Add a subtle inner glow on focus (`focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]`) so users see the field is active.

**Send button (line ~836–851)**
- Fix the "Enter button not clear" issue: increase contrast and clarity.
  - Use a brighter primary fill, add a thin bright ring, and add a tiny `CornerDownLeft` (Enter glyph) underlay when input is empty so users immediately understand "press Enter or tap to send".
  - When input has text: show the `Send` icon at full opacity with a stronger shadow.
  - When disabled: keep button visible but at 40% opacity (instead of 60%) so it's clearly inactive without disappearing.

---

## Technical Notes

- No design-system token changes; everything stays on semantic tokens (`bg-primary`, `text-foreground`, etc.) per project styling rules.
- No new dependencies.
- No routing or auth changes.
- Files touched (2): `src/components/GlobalErrorBoundary.tsx`, `src/components/ConciergeChat.tsx`.
