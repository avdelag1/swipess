

## Plan: Fix white background globally, limit photos to 1 for profiles and listings

### Three targeted fixes

#### 1. Force white background everywhere

**`index.html`** (line 31): Change splash screen background from `#050505` to `#ffffff`.

**`src/index.css`**: Add explicit `body, html` background and foreground using CSS variables so the white theme applies globally without gaps:
```css
body, html {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

**`src/styles/matte-themes.css`**: The `.light` theme already defines `--background: 0 0% 100%` (white) — this is correct. No change needed.

**`src/hooks/useTheme.tsx`**: Change `DEFAULT_THEME` from `'dark'` to `'light'` so the app starts white by default.

#### 2. Limit profile photos to 1

**`src/components/ClientProfileDialog.tsx`** (line 398): Change `maxPhotos={5}` → `maxPhotos={1}`

**`src/components/OnboardingFlow.tsx`** (line 235): Change `maxPhotos={10}` → `maxPhotos={1}`

(Owner profile already has `maxPhotos={1}` in `OwnerProfileDialog.tsx`)

#### 3. Limit listing photos to 1

**`src/components/UnifiedListingForm.tsx`**: Change `getMaxPhotos()` to always return `1` for all categories.

**`src/components/ConversationalListingCreator.tsx`**: Change `MAX_PHOTOS` values to all `1`.

**`src/components/PhotoUploadManager.tsx`**: No structural changes needed — it already respects the `maxPhotos` prop.

---

### Files to edit (7 total)

| File | Change |
|------|--------|
| `index.html` | Splash background → `#ffffff` |
| `src/index.css` | Add `body, html { background-color; color }` rules |
| `src/hooks/useTheme.tsx` | Default theme → `'light'` |
| `src/components/ClientProfileDialog.tsx` | `maxPhotos={1}` |
| `src/components/OnboardingFlow.tsx` | `maxPhotos={1}` |
| `src/components/UnifiedListingForm.tsx` | All categories return `1` photo max |
| `src/components/ConversationalListingCreator.tsx` | All `MAX_PHOTOS` values → `1` |

