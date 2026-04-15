

## Make Quick Filter Cards Fill the Screen on All Devices

The cards are currently capped at **480px wide** and **700px tall** even on large iPads. On an iPad Pro 13-inch (1024x1366), that leaves massive empty space. The fix is to make the cards fluid -- filling the available viewport on every device.

---

### Changes

**1. `src/index.css` -- Fluid card width with larger breakpoints**

Replace the fixed `--card-width` values with a fluid system that scales up for tablets and desktops:

```css
:root { --card-width: 340px; }
@media (min-width: 768px)  { :root { --card-width: min(520px, calc(100vw - 160px)); } }
@media (min-width: 1024px) { :root { --card-width: min(640px, calc(100vw - 200px)); } }
@media (min-width: 1366px) { :root { --card-width: min(720px, calc(100vw - 240px)); } }
```

**2. `src/components/swipe/SwipeAllDashboard.tsx` -- Remove the 700px height cap**

Change the card stack container to fill more of the viewport on larger screens:

```tsx
style={{ 
  width: 'min(var(--card-width, 340px), calc(100vw - 80px))',
  height: 'calc(100dvh - 190px)',
  maxHeight: 'min(calc(100dvh - 190px), 480px, 700px, 900px)', // scale with viewport
}}
```

Replace `maxHeight` with a responsive approach: `480px` on phones (via CSS clamp or media query), no cap on tablets/desktops so the card fills the available space.

**3. `src/components/swipe/PokerCategoryCard.tsx` -- Scale typography and CTA for larger cards**

Add responsive sizing so text and buttons grow proportionally:
- Title: `text-3xl md:text-4xl lg:text-5xl`
- CTA button height: `h-16 md:h-[72px] lg:h-20`
- Bottom padding: `pb-8 md:pb-10 lg:pb-14`

**4. Quick audit pass** -- Verify no runtime errors by checking:
- `SwipeConstants.ts` for any hardcoded PK_W/PK_H values still referenced
- The `PokerCategoryCard` stack offsets and scale factors still work at larger sizes
- `will-change` properties are present for GPU acceleration

---

### Result

Cards will feel immersive and edge-to-edge on iPad Pro, scale naturally on tablets, and remain proportional on phones -- big photos, big experience on every screen.

