

# Fix Plan: Background Color Issues + Build Errors + AI Orchestrator

## Problem Analysis

### 1. Pink/Weird Background Color on Light Theme
The `GradientMasks.tsx` system in `AppLayout.tsx` renders fixed gradient overlays (top, bottom, vignette) across all pages. In light theme (`white-matte`), these use white (`rgb(255,255,255)`) base colors at up to 40% opacity, creating a washed-out, pinkish tint over the content. The overlays sit at z-index 15-20, covering buttons and content areas. This is what creates the "something on top of buttons" effect you're seeing.

### 2. AI Orchestrator + MiniMax
The `MINIMAX_API_KEY` secret is already configured. The orchestrator code in `supabase/functions/ai-orchestrator/index.ts` already has MiniMax as a fallback provider with `isMinimaxForced = false` (Gemini primary, MiniMax fallback). This is working as designed.

### 3. Build Errors (25+ errors blocking the app)
Multiple TypeScript errors need fixing across several files.

---

## Plan

### Step 1: Fix Light Theme Gradient Overlays
**File: `src/components/ui/GradientMasks.tsx`**
- Reduce intensity of gradients in light mode significantly (max opacity from 0.35/0.40 down to ~0.10-0.15)
- Use fully transparent vignette in light mode to avoid the dirty/pink look
- This preserves the cinematic effect in dark mode while keeping light mode clean

### Step 2: Fix Build Errors (all files)

**`src/components/ConversationalListingCreator.tsx`** - Missing imports:
- Add `import { motion } from 'framer-motion'` and `import { cn } from '@/lib/utils'`

**`src/components/LegendaryLandingPage.tsx`** (lines 416, 431):
- Change `autocomplete` to `autoComplete` (React JSX attribute)

**`src/components/SwipessSwipeContainer.tsx`** (line 641):
- Add `existingIds` and `dismissedSet` variable definitions before the filter call using the existing `deckQueueRef` and `dismissedIds`

**`src/components/UnifiedListingForm.tsx`**:
- Remove duplicate `import { cn } from '@/lib/utils'` (line 19)
- Replace `notifications.listing.updated/created` with `toast()` calls
- Fix the `stagger` variants type issue (wrap in proper Variants format)

**`src/pages/ClientProfileNew.tsx`** and **`src/pages/OwnerProfileNew.tsx`**:
- Remove duplicate `SharedProfileSection` import (line 5 / line 4)
- Fix `staggerChildren` variants type (same pattern as UnifiedListingForm)

**`src/pages/MessagingDashboard.tsx`**:
- Remove unused `@ts-expect-error` directive (line 30)
- Remove references to `stats.unreadCount` (property doesn't exist on stats type) - use optional chaining or cast

**Remaining files** (ClientWhoLikedYou, ClientWorkerDiscovery, ClientFilters, ClientContracts, OwnerContracts, OwnerInterestedClients, OwnerViewClientProfile, useSwipeAnalytics, realtimeManager, SwipeQueue):
- Add missing type annotations, fix null/undefined handling, add missing properties to interfaces

### Step 3: Verify AI Orchestrator MiniMax Configuration
- The MiniMax API key is already stored as a secret
- The orchestrator already uses it as fallback
- No code changes needed -- it's functional

