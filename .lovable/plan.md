

# Ultra Polish Mode: Premium UI Refinement + Bug Fixes

This plan takes a phased, incremental approach. Phase 1 (this implementation) focuses on the highest-impact changes that will immediately make the app feel premium without breaking the existing architecture.

## What stays the same
- Core layout and navigation structure
- Swipe card mechanics
- All existing features and routes
- The dark theme identity

## What changes

### 1. Fix the reviews table (stops the constant errors)

The `reviews` table was created with only basic columns but the code queries for many more. A migration will add all the missing columns:

- `review_title` (text)
- `review_type` (text, default 'property')
- `cleanliness_rating`, `communication_rating`, `accuracy_rating`, `location_rating`, `value_rating` (integer, 1-5)
- `response_text` (text)
- `responded_at` (timestamptz)
- `is_verified_stay` (boolean, default false)
- `is_flagged` (boolean, default false)
- `helpful_count` (integer, default 0)

This stops the repeating "column reviews.is_flagged does not exist" errors on every swipe card.

### 2. Unified Design Token System

Create a new file `src/styles/tokens.css` with centralized CSS custom properties:

- **Radius tokens**: `--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 20px`, `--radius-xl: 28px`
- **Elevation tokens**: 4 levels of shadow depth (surface, elevated, floating, modal)
- **Motion tokens**: `--ease-spring`, `--ease-smooth`, `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 400ms`
- **Glass surface tokens**: `--glass-bg`, `--glass-border`, `--glass-blur`

These tokens get imported into `index.css` and used by all components going forward.

### 3. Premium Glass Surface Component

Create `src/components/ui/glass-surface.tsx` - a reusable wrapper that gives any panel/section a premium frosted glass look:

- Subtle translucent background with backdrop blur (desktop only for performance)
- Multi-layer depth shadow
- Soft internal highlight border
- Configurable elevation level (surface / elevated / floating / modal)

This replaces the basic Card usage in Settings, Filters, and Profile pages.

### 4. Motion System Upgrade

Update `src/components/PageTransition.tsx`:
- Replace the current 0.08s duration with spring physics (stiffness: 380, damping: 30)
- Add `prefers-reduced-motion` respect
- Add a new `glass` variant for settings/filter pages

Update the stagger system:
- Faster stagger delay (0.04s instead of 0.06s)
- Add subtle scale on entry (0.98 to 1 instead of 0.97 to 1)
- Add spring physics to each item

### 5. Settings Page Refinement

Both `ClientSettingsNew.tsx` and `OwnerSettingsNew.tsx`:
- Wrap the settings menu items in the new GlassSurface component
- Add smooth icon hover micro-animations (subtle translate + color shift)
- Add pressed state feedback on each row
- Clean spacing using token system
- Remove redundant "Back" button (PageHeader already has one)

### 6. Filter Pages Refinement

Both `ClientFilters.tsx` and `OwnerFilters.tsx`:
- Replace Cards with GlassSurface for filter sections
- Add spring-based toggle animations for filter selections
- Smoother category pill transitions
- Consistent radius and spacing from token system

### 7. Button and Interactive Element Polish

Update `src/components/ui/button.tsx`:
- Add subtle elevation change on hover (shadow lifts)
- Refine the ripple effect timing (300ms instead of 400ms)
- Add a glass variant for overlay buttons

Update `src/components/ui/card.tsx`:
- Remove the aggressive `hover:-translate-y-1` (too much movement for settings cards)
- Use token-based radius and shadow
- Add a `variant` prop: default (no hover lift) and interactive (with hover lift)

### 8. Consistent Active States

In `src/index.css`:
- Refine the global `button:active` scale from 0.97 to 0.96 with a spring-like cubic-bezier
- Add subtle opacity change on press (0.95)
- Remove the `!important` on mobile transition-duration override (causes janky animations)

### 9. MiniMax AI Integration Prep

The user mentioned having a MiniMax API key for AI features. This phase will:
- Create a placeholder AI chat component structure at `src/components/ai/AIChatAssistant.tsx`
- The user will need to provide the MiniMax API key via the secrets manager
- Full implementation will follow in a subsequent phase once the key is configured

## Technical Details

### Files to create:
- `src/styles/tokens.css` - Design token system
- `src/components/ui/glass-surface.tsx` - Premium glass surface component

### Files to modify:
- New migration SQL - Add missing columns to reviews table
- `src/index.css` - Import tokens, refine active states, remove mobile transition override
- `src/components/ui/button.tsx` - Hover elevation, faster ripple
- `src/components/ui/card.tsx` - Remove aggressive hover, add variant prop
- `src/components/PageTransition.tsx` - Spring physics, reduced-motion respect
- `src/pages/ClientSettingsNew.tsx` - Glass surface, micro-interactions
- `src/pages/OwnerSettingsNew.tsx` - Glass surface, micro-interactions
- `src/pages/ClientFilters.tsx` - Glass surface, spring toggles
- `src/pages/OwnerFilters.tsx` - Glass surface, spring toggles

### Performance rules followed:
- Only `transform` and `opacity` for animations
- Backdrop blur disabled on mobile (already in place)
- `will-change` used sparingly
- `prefers-reduced-motion` respected
- No layout thrashing (no width/height animations)

