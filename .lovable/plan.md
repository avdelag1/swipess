

## Redesign Virtual ID Card with Switchable Themes

### What's Wrong Now
1. QR code overlaps with the X close button (visible in screenshot)
2. Single static dark-blue design — no personality or customization
3. Layout feels generic, not Apple-quality

### What We'll Build

A theme-switching system for the Virtual ID card with 5 premium skins the user can cycle through by tapping a small palette icon. Each theme changes the card's background, accent colors, pattern overlay, and typography tones.

**Themes:**
1. **Obsidian** — Pure black with subtle silver accents, minimal dot grid pattern
2. **Pearl** — Clean white/cream with soft gray shadows, elegant light mode
3. **Rosa Mexicano** — Hot pink gradient with cheetah/animal print pattern overlay at low opacity
4. **Jungle** — Deep tropical greens with palm leaf silhouette pattern (Tulum vibe)
5. **Sahara** — Warm sand/terracotta tones with abstract organic texture

**Layout Fixes:**
- Move QR code to the bottom-right corner of the card (away from X button)
- Move close button to top-right with proper clearance
- QR gets smaller (56px) and sits in the footer area next to "swipess.app"
- ID number stays top-right where QR used to be

### Implementation

#### Step 1: Add theme state and definitions
Add a `useState` for `themeIndex` in `VapIdCardModal.tsx`. Define a