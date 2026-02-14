# 🎨 Premium Visual System

A cinematic luxury visual system combining SaaS polish with high-end motion design.

## 🎯 Design Philosophy

### Motion = Calm + Confident
- No bouncing or overshooting
- Everything glides smoothly
- Apple-level polish

### Depth = Layers
- Foreground: Sharp and interactive
- Midground: Soft transitions
- Background: Animated subtly

### Feedback = Micro, Not Loud
- Hover scale: 1.02–1.03 max
- Tap scale: 0.97
- Soft glow, not neon

---

## 📦 Components

### Core Engine

#### `VisualEngine`
Persistent animated background layer system with depth.

```tsx
import { VisualEngine } from '@/visual';

// Already integrated in AppLayout.tsx
<VisualEngine />
```

Features:
- Adapts to light/dark theme automatically
- Soft animated gradient glows
- Non-distracting ambient motion
- Subtle noise overlay for texture

#### `ReactiveBackground`
Optional background that responds to user actions.

```tsx
import { ReactiveBackground } from '@/visual';

<ReactiveBackground sentiment="positive" /> // Green tint
<ReactiveBackground sentiment="negative" /> // Red tint
<ReactiveBackground sentiment="neutral" />  // No tint
```

---

### Buttons

#### `PremiumButton`
Luxury button with micro-interactions.

```tsx
import { PremiumButton } from '@/visual';

<PremiumButton
  variant="glass"        // glass | solid | outline | ghost | luxury
  size="md"              // sm | md | lg
  hoverEffect="subtle"   // subtle | medium | prominent
>
  Click me
</PremiumButton>
```

#### `IconButton`
Premium icon-only button.

```tsx
import { IconButton } from '@/visual';

<IconButton size="md">
  <Icon />
</IconButton>
```

#### `FloatingActionButton`
FAB with glow effect.

```tsx
import { FloatingActionButton } from '@/visual';

<FloatingActionButton>
  <PlusIcon />
</FloatingActionButton>
```

---

### Cards

#### `PremiumCard`
Luxury card with depth and motion.

```tsx
import { PremiumCard } from '@/visual';

<PremiumCard
  variant="glass"     // glass | elevated | flat | luxury
  size="md"           // sm | md | lg | full
  hoverEffect={true}  // Enable/disable hover lift
>
  Card content
</PremiumCard>
```

#### `SwipeCard`
Enhanced card for swipe interactions.

```tsx
import { SwipeCard } from '@/visual';

<SwipeCard
  onSwipeRight={() => console.log('Swiped right')}
  onSwipeLeft={() => console.log('Swiped left')}
>
  Swipeable content
</SwipeCard>
```

#### `FeatureCard`
Premium card for showcasing features.

```tsx
import { FeatureCard } from '@/visual';

<FeatureCard
  icon={<SparklesIcon />}
  title="Amazing Feature"
  description="This feature is incredible"
/>
```

#### `GlowCard`
Card with animated glow effect.

```tsx
import { GlowCard } from '@/visual';

<GlowCard glowColor="primary"> // primary | purple | blue
  Premium content
</GlowCard>
```

---

### Transitions

#### `PageTransition`
Cinematic page entrance wrapper (optional - AppLayout already handles transitions).

```tsx
import { PageTransition } from '@/visual';

<PageTransition variant="slideUp"> // slideUp | fade | scale
  <YourPage />
</PageTransition>
```

#### `StaggerContainer` & `StaggerItem`
Cascading entrance animations for lists.

```tsx
import { StaggerContainer, StaggerItem } from '@/visual';

<StaggerContainer staggerDelay={0.05}>
  <StaggerItem>Item 1</StaggerItem>
  <StaggerItem>Item 2</StaggerItem>
  <StaggerItem>Item 3</StaggerItem>
</StaggerContainer>
```

---

### Micro-Interactions

#### `PressableArea`
Generic pressable wrapper with feedback.

```tsx
import { PressableArea } from '@/visual';

<PressableArea
  onPress={() => {}}
  scaleEffect="subtle" // subtle | medium | prominent
>
  Press me
</PressableArea>
```

#### `ScaleOnHover`
Subtle scale effect for any element.

```tsx
import { ScaleOnHover } from '@/visual';

<ScaleOnHover scale={1.03}>
  <div>Hover me</div>
</ScaleOnHover>
```

#### `FadeIn`
Smooth fade-in animation.

```tsx
import { FadeIn } from '@/visual';

<FadeIn delay={0.2}>
  <div>Fades in</div>
</FadeIn>
```

#### `SlideIn`
Slide-in animation from direction.

```tsx
import { SlideIn } from '@/visual';

<SlideIn
  direction="up"    // left | right | up | down
  delay={0}
  distance={24}
>
  <div>Slides in</div>
</SlideIn>
```

#### `PulseGlow`
Subtle pulsing glow effect.

```tsx
import { PulseGlow } from '@/visual';

<PulseGlow
  glowColor="primary"  // primary | purple | blue | green | red
  intensity="low"      // low | medium | high
>
  <div>Glowing element</div>
</PulseGlow>
```

#### `FloatEffect`
Gentle floating animation.

```tsx
import { FloatEffect } from '@/visual';

<FloatEffect distance={8} duration={4}>
  <div>Floats gently</div>
</FloatEffect>
```

#### `ShimmerEffect`
Subtle shimmer/shine effect.

```tsx
import { ShimmerEffect } from '@/visual';

<ShimmerEffect>
  <div>Shimmering content</div>
</ShimmerEffect>
```

---

## ⚙️ Configuration

### Motion Config

```tsx
import {
  premiumEasing,
  cinematicEasing,
  pageTransition,
  microInteraction,
  hoverScale,
  tapScale,
  motionVariants,
  getTransitionDuration
} from '@/visual';

// Use in custom animations
<motion.div
  animate={{ scale: 1 }}
  transition={{ duration: 0.2, ease: premiumEasing }}
/>
```

### User Preferences

#### Hook: `useVisualPreferences`

```tsx
import { useVisualPreferences } from '@/hooks/useVisualPreferences';

function MyComponent() {
  const {
    preferences,
    loading,
    setAnimationLevel,
    setVisualMode,
    toggleReduceMotion,
    toggleBackgroundEffects,
    toggleHaptics,
  } = useVisualPreferences();

  // Use preferences
  if (preferences.reduce_motion) {
    // Disable animations
  }
}
```

#### Settings UI Component

```tsx
import { VisualPreferencesSettings } from '@/visual';

// Add to your settings page
<VisualPreferencesSettings />
```

---

## 🗄️ Database

### Table: `user_visual_preferences`

Stores user animation and visual preferences.

**Columns:**
- `animation_level`: "minimal" | "standard" | "premium" | "cinematic"
- `visual_mode`: "minimal" | "premium" | "luxury" | "cinematic"
- `reduce_motion`: boolean (accessibility)
- `enable_background_effects`: boolean
- `enable_haptics`: boolean (mobile)

**Migration:** `supabase/migrations/20260214172011_add_user_visual_preferences.sql`

---

## 🎨 Visual Modes

### Premium (Default)
- Smooth animations
- Subtle glass morphism
- Soft shadows
- Professional feel

### Luxury (Current Implementation)
- Cinematic depth
- Animated backgrounds
- Soft glows
- High-end feel

### Minimal
- No animations
- Instant transitions
- Accessibility-first

### Cinematic
- Dramatic transitions
- Maximum visual impact
- Artistic feel

---

## 🚀 Quick Start

### 1. Already Integrated
The visual system is already integrated into your app via `AppLayout.tsx`.

### 2. Use Components
Simply import and use the components:

```tsx
import { PremiumButton, PremiumCard } from '@/visual';

function MyPage() {
  return (
    <PremiumCard variant="luxury">
      <h1>Welcome</h1>
      <PremiumButton variant="solid">
        Get Started
      </PremiumButton>
    </PremiumCard>
  );
}
```

### 3. Add Settings (Optional)
Add visual preferences to your settings page:

```tsx
import { VisualPreferencesSettings } from '@/visual';

function SettingsPage() {
  return (
    <div>
      <VisualPreferencesSettings />
    </div>
  );
}
```

---

## 🎯 Best Practices

### ✅ Do
- Use `PremiumButton` for primary actions
- Use `PremiumCard` for content containers
- Use `FadeIn` for page sections
- Use `StaggerContainer` for lists
- Respect user's `reduce_motion` preference

### ❌ Don't
- Don't stack multiple animations
- Don't use animations longer than 0.6s
- Don't animate large elements
- Don't ignore accessibility settings

---

## 🔧 Customization

### Custom Transitions

```tsx
import { motion } from 'framer-motion';
import { premiumEasing } from '@/visual';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.45, ease: premiumEasing }}
/>
```

### Custom Hover Effects

```tsx
import { motion } from 'framer-motion';
import { microInteraction, hoverScale } from '@/visual';

<motion.div
  whileHover={{ scale: hoverScale.medium }}
  transition={microInteraction}
/>
```

---

## 🎭 Animation Levels

| Level | Duration | Use Case |
|-------|----------|----------|
| Minimal | 0s | Accessibility, slow devices |
| Standard | 0.2s | Fast, efficient |
| Premium | 0.45s | Luxury, recommended |
| Cinematic | 0.6s | Dramatic, special moments |

---

## 📱 Mobile Optimization

- Fast transitions (0.08s on mobile)
- Reduced motion detection
- Haptic feedback support
- GPU-accelerated animations
- Touch-optimized interactions

---

## ♿ Accessibility

- Respects `prefers-reduced-motion`
- Keyboard navigation support
- Screen reader friendly
- High contrast compatible
- Focus indicators

---

## 🎨 Color Palette

The visual system adapts to your theme automatically:

- **Dark Mode**: Deep slate backgrounds with purple/blue accents
- **Light Mode**: Clean white/slate with subtle color
- **Glass Effect**: Uses backdrop-blur for premium feel

---

## 📊 Performance

- GPU-accelerated transforms
- Minimal repaints
- Debounced interactions
- Lazy-loaded effects
- Optimized for 60fps

---

## 🔗 Integration Points

### Current Integration
- ✅ AppLayout.tsx (VisualEngine mounted)
- ✅ Framer Motion installed
- ✅ Theme system connected
- ✅ Database migrations ready

### Optional Integrations
- Add `VisualPreferencesSettings` to settings page
- Use premium components throughout app
- Add reactive backgrounds to swipe cards
- Implement haptic feedback on mobile

---

## 🎬 Examples

See component files for detailed examples:
- `/src/visual/PremiumButton.tsx`
- `/src/visual/PremiumCard.tsx`
- `/src/visual/MicroInteractions.tsx`
- `/src/visual/PageTransition.tsx`

---

## 🤝 Contributing

When adding new visual components:
1. Follow the established patterns
2. Use the motion config constants
3. Support light/dark themes
4. Add accessibility features
5. Document usage examples

---

Built with ❤️ for Swipess
