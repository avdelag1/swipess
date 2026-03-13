

# Theme Adaptation: Make White Mode Fully White, Black Mode Fully Black

## Problem

There are **2,800+ instances of `text-white`** and **hundreds of `bg-black`, `bg-[#0...]`, `bg-[#1...]`** hardcoded across 82 component files and 36 page files. When you switch to white-matte theme, these elements stay white text on white backgrounds (invisible) or show dark cards on a white page (visual clash).

## Strategy

Rather than editing all 100+ files individually (which would take many sessions and risk regressions), we use a **CSS-level override** approach. This is the same pattern used by major apps (Slack, Linear, Discord) — a single stylesheet that remaps hardcoded colors when a specific theme class is active.

### How It Works

We add a new CSS file `src/styles/theme-overrides.css` that targets the `.white-matte` class and overrides all hardcoded dark-mode colors at the CSS level:

- `text-white` → dark text
- `text-white/XX` (opacity variants) → dark text with appropriate opacity
- `bg-black`, `bg-[#000000]`, `bg-[#0e0e11]`, etc. → white/light backgrounds
- `bg-white/5`, `bg-white/10` (glass surfaces) → dark equivalents
- `border-white/XX` → dark border equivalents
- `placeholder:text-white/XX` → dark placeholder text

This approach:
1. Fixes ALL pages and components at once
2. Requires no changes to individual component files
3. Is reversible (just remove the CSS file)
4. Works with both existing and future components

### Targeted Component Fixes

A few components need individual attention because they use inline `style={}` with hardcoded colors (CSS overrides can't touch those):

| File | Issue |
|------|-------|
| `src/components/VirtualizedMessageList.tsx` | `bg-[#000000]` hardcoded — change to `bg-background` |
| `src/pages/NotificationsPage.tsx` | Cards use `bg-black/40`, `text-white` without theme check — add `isDark` conditional |
| `src/pages/AITestPage.tsx` | Chat bubbles and input area use `bg-black/60`, `text-white` — add `isDark` conditional |
| `src/pages/MockOwnersTestPage.tsx` | Entire page is `bg-black text-white` — add theme awareness |
| `src/components/ChatPreviewSheet.tsx` | All text hardcoded `text-white` — add `isDark` conditional |

### File Changes

| File | Change |
|------|--------|
| `src/styles/theme-overrides.css` | **NEW** — CSS overrides for `.white-matte` theme to remap hardcoded dark colors |
| `src/index.css` or main CSS entry | Import the new override file |
| `src/components/VirtualizedMessageList.tsx` | Replace `bg-[#000000]` with `bg-background` |
| `src/pages/NotificationsPage.tsx` | Add `isDark` conditionals to card backgrounds, text colors, and dialog |
| `src/pages/AITestPage.tsx` | Add `isDark` conditionals to chat bubbles, input area, empty state |
| `src/pages/MockOwnersTestPage.tsx` | Add `isDark` conditionals to page background and header |
| `src/components/ChatPreviewSheet.tsx` | Add `isDark` conditionals to all hardcoded text colors |

## What This Achieves

After this change, every page will:
- Show dark text on white backgrounds in white-matte mode
- Show white text on dark backgrounds in black-matte mode
- Buttons, badges, and accent colors (orange/pink gradients) remain vibrant in both modes
- Glass surfaces adapt (light frosted glass in white mode, dark frosted glass in dark mode)

