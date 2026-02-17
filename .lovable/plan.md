
## Tagline Spacing & Position Fix

### What the User Wants
1. **Move the tagline UP** — closer to the logo, not floating far below it
2. **Visual separation** between "swipe or" and "tap to connect" — they feel crowded on one line
3. **Slogan must fit** — no overflow, no cramping into the logo image

### Current State (the problem)
```
Logo image (96vw wide, large)
    ↕ -mt-4 gap  ← too much distance still
"swipe or tap to connect"  ← all on one line, cramped
    ↕ mt-3
Info chips
```

The `-mt-4` negative margin pulls the tagline up a little, but the logo image itself has no bottom padding restraint, so there's still visual distance. The text runs as one undifferentiated phrase.

### The Fix — One File Only: `src/components/LegendaryLandingPage.tsx`

**1. Tighten the gap between logo and tagline**

Change the tagline wrapper from `-mt-4` to `-mt-6` (pull it closer up toward the bottom edge of the logo, without overlapping the image itself).

**2. Break "swipe or tap to connect" into two visual lines**

Split it into a two-line layout:
```
swipe or
tap to connect
```

Using a `flex flex-col items-center gap-0.5` wrapper with each phrase as its own `<span>`:
- First line: **"swipe or"** — slightly smaller, secondary weight, muted
- Second line: **"tap to connect"** — full weight gradient, slightly larger

This creates a natural visual rhythm and breathing room between the two calls-to-action.

**3. Reduce font size slightly to guarantee fit**

Current: `text-3xl sm:text-4xl md:text-5xl`
New: `text-2xl sm:text-3xl md:text-4xl` — still bold and readable, avoids overflow on narrower screens.

### Result

```
[  Logo image  ]
  ↕ tight gap
     swipe or
  tap to connect
  ↕ mt-3
[ chips ]
```

Clean, hierarchical, cinematic — slogan reads top-to-bottom like a call-to-action funnel.

### Only 1 File Changes
- **`src/components/LegendaryLandingPage.tsx`** — lines ~123–140 (tagline `<motion.p>` block)
