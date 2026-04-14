

## Fix: Clear Stale Vite Cache + Create iOS Privacy Manifest

### Diagnosis

The `useState` null error in `SwipeAllDashboard.tsx` is **not a code bug**. The component is correctly structured -- imports are fine, hooks are inside the component body, `memo` wrapping is correct. This is a **Vite HMR cache corruption** from the many rapid edits today. The dev server's dependency optimization cache (`node_modules/.vite`) has stale React module references, causing React's internal dispatcher to be `null`.

The codebase is otherwise stable: `GlobalDialogs` properly uses `DeferredDialog` gating, `lazyWithRetry` no longer reloads, `ChunkErrorBoundary` catches chunk failures, and the prefetcher excludes heavy routes.

### What needs to happen

**Step 1: Force Vite cache reset**
- Delete `node_modules/.vite` directory to clear corrupted dependency optimization cache
- Run `npm run build` to verify the production bundle is clean (this is the build that ships to iOS)

**Step 2: Create iOS Privacy Manifest**
- The `ios/` directory does not exist in the repo (it is generated locally by `npx cap add ios`). The privacy manifest needs to be placed where Capacitor can pick it up during sync.
- Create `public/PrivacyInfo.xcprivacy` with the required Apple declarations:
  - `NSPrivacyAccessedAPICategoryUserDefaults` (reason: `CA92.1`) -- used by auth, theme, filters via localStorage
  - `NSPrivacyAccessedAPICategorySystemBootTime` (reason: `35F9.1`) -- used by performance timing
  - `NSPrivacyTracking = false`
  - No collected data types declared at the app level (handled by Capacitor/Supabase SDKs)

**Step 3: Add a tiny cache-bust comment to SwipeAllDashboard.tsx**
- Add a harmless comment change to force Vite to re-process this specific module, breaking the stale HMR reference chain

### Files to modify
| File | Action |
|------|--------|
| `public/PrivacyInfo.xcprivacy` | Create -- Apple-required privacy manifest |
| `src/components/swipe/SwipeAllDashboard.tsx` | Add cache-bust comment (line 1) |
| `node_modules/.vite` | Delete via exec |

### Post-implementation
After these changes, the user should:
1. Hard-refresh the preview (Ctrl/Cmd+Shift+R)
2. For iOS submission: `npm run build && npx cap sync ios` -- the privacy manifest in `public/` will be copied to `dist/` and available for manual placement in the Xcode project

