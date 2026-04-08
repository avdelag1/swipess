

## Plan: Elevate AI Chat Experience — Living Indicator + Smart Actions

### What we're building

1. **"Alive" AI thinking indicator** — Replace the basic bouncing dots with a premium breathing/pulsing orb animation on the Sparkles icon that feels organic and alive, like the AI is genuinely thinking. Smooth sine-wave glow effect.

2. **Enhanced typing indicator** — Replace the 3 bouncing dots with a subtle audio-waveform style animation (3-5 bars that oscillate at different heights/speeds), giving a "the AI is speaking" feel.

3. **Header status indicator** — The Sparkles icon in the header pulses gently when the AI is processing, showing the AI is "alive" even at a glance.

4. **Translate button on AI messages** — Add a translate icon to the assistant message action bar. Tapping it shows a small language picker (the 8 supported languages). Selecting one sends a follow-up message like "Translate your last response to Spanish" so the AI handles it naturally — no extra API needed.

5. **Long-press copy on mobile** — Make action buttons (copy, resend, translate) always visible on mobile (no hover state on touch devices), ensuring usability.

### Technical approach

**File: `src/components/ConciergeChat.tsx`**

- **TypingIndicator**: Rewrite with 4-5 vertical bars using `framer-motion` with staggered `scaleY` animations (wave effect). Each bar oscillates between `scaleY(0.3)` and `scaleY(1)` with different phase delays.
- **Header Sparkles icon**: When `isLoading`, wrap in a `motion.div` with breathing scale (1 → 1.15 → 1) and a soft glow (`box-shadow` pulse using primary color at low opacity).
- **MessageBubble**: Add translate button (Globe icon from lucide) for assistant messages. On click, show a tiny popover with language options. Selecting one calls `sendMessage("Translate your last response to {language}")`.
- **Mobile action visibility**: Change `opacity-0 group-hover:opacity-100` to always show on touch devices using a media query or `@media (hover: none)` approach via Tailwind's `hover:` modifier.

**No backend changes needed** — translation is handled by prompting the AI directly.

### Summary of changes

| Change | File |
|--------|------|
| Wave-style typing indicator | `ConciergeChat.tsx` |
| Breathing glow on header icon | `ConciergeChat.tsx` |
| Translate action on AI messages | `ConciergeChat.tsx` |
| Mobile-friendly action buttons | `ConciergeChat.tsx` |

Single file edit, no database or edge function changes.

