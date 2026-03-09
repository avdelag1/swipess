

# Swipe Action Buttons: Frameless Icon Redesign + PWA Polish

## What Changes

### 1. Remove All Backgrounds from Action Buttons
The current `SwipeActionButtonBar.tsx` has:
- Glass tray container behind buttons (lines 360-375) — **remove entirely**
- Each button has `backgroundColor`, `backdropFilter`, `border` — **remove all**
- Replace with **pure icon-only design**: just the colored icon floating with expressive shadows and glow

### 2. New "Phantom Icon" Aesthetic
Each button becomes a **borderless, backgroundless icon** with:
- **Deep colored drop-shadow** (e.g., `0 4px 20px rgba(255,107,53,0.5)` for Like) — gives depth without a frame
- **Radial glow pulse** on tap — a brief colored light bloom behind the icon that fades
- **Spring scale compression** on press (keep existing `TAP_SCALE: 0.87`)
- **Icon stroke weight increase** for visual authority (2.5-3.0 strokeWidth)
- Large icons get slightly bigger (`34px`) for dominance without a container

### 3. Liquid Tap Effect (replaces ripple)
Instead of the current ripple-inside-circle effect:
- On tap, a **soft radial glow expands outward** from the icon center and fades — like a light burst
- Color-matched to each button's identity color
- Duration: 400ms, ease-out

### 4. PWA & Performance Smoothness Pass
- Remove `backdropFilter: blur(28px)` from all 5 buttons — this is the single biggest PWA performance killer (5 blur layers per frame)
- Remove the tray's `backdropFilter: blur(12px)` — another expensive layer
- Total: **6 blur layers eliminated** from the most interactive part of the UI
- Keep `transform: translateZ(0)` for GPU compositing
- Result: significantly smoother swipe + button interactions in PWA mode

### Files Modified
- `src/components/SwipeActionButtonBar.tsx` — full redesign of ActionButton and container

### What Stays the Same
- Button order: Undo, Dislike, Share, Like, Message
- Sizing hierarchy: large for Like/Dislike, small for Undo/Share/Message
- Haptic feedback on tap
- Icon choices (Flame, ThumbsDown, Share2, RotateCcw, MessageCircle)
- Spring animation configs
- All click handlers and props interface

