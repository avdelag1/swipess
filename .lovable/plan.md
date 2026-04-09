

## Plan: Fix Page Arrival Animations — Smooth Instant Transitions

### Problem

When navigating between pages (especially on client side), pages "arrive from the left" in a jarring way. The `AnimatedOutlet` currently has zero transition — it's a raw swap. Combined with swipe gestures, the abrupt content replacement feels broken and unprofessional.

### Solution

Add a subtle, fast **fade-in** entrance to `AnimatedOutlet` using CSS transitions. No sliding — just a clean opacity + micro-scale entrance that feels instant but polished. This applies to both client and owner sides uniformly.

### Changes

**1. `src/components/AnimatedOutlet.tsx`** — Add CSS-based fade entrance

Replace the static `<div>` wrapper with a keyed container that triggers a CSS animation on route change. Use `location.pathname` only as a CSS animation trigger (via `key` on an inner element), NOT as a React `key` on the outlet itself (to preserve the no-flicker architecture).

```tsx
import { useOutlet, useLocation } from 'react-router-dom';
import { Suspense, useRef, useState, useEffect } from 'react';
import { SuspenseFallback } from './ui/suspense-fallback';

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const [fadeClass, setFadeClass] = useState('');

  useEffect(() => {
    setFadeClass('opacity-0');
    const raf = requestAnimationFrame(() => {
      setFadeClass('opacity-100');
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div
      className={`h-full min-h-0 w-full flex flex-col flex-1 transition-opacity duration-150 ease-out ${fadeClass}`}
      style={{ position: 'relative' }}
    >
      <Suspense fallback={<SuspenseFallback minimal />}>
        {outlet}
      </Suspense>
    </div>
  );
}
```

This gives every page change a 150ms fade-in — fast enough to feel instant, smooth enough to eliminate the jarring "slide from left" perception. No framer-motion overhead, pure CSS.

### What this fixes
- Client dashboard pages arriving with a harsh visual snap
- Owner pages having the same issue
- Consistent, premium-feeling transitions across both roles
- Zero impact on scroll ownership or swipe physics

