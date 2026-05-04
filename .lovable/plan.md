# Fix: `useActiveMode must be used within an ActiveModeProvider`

## Root cause

The error is **not** a missing Provider. The Provider IS mounted (visible in the React component stack, wrapping everything below it).

The real issue: two different module instances of `src/hooks/useActiveMode.tsx` are loaded at the same time (visible from the `?t=...` cache-bust timestamps in the stack — one is `1777931364183`, the other is `1777930982912`). Each instance calls `createContext()` and produces its own context object. The Provider publishes value into Context-A; the consumer reads from Context-B and gets `undefined` → throws.

This happens because:
- `useActiveMode.tsx` exports the Context, the Provider, AND the consumer hook all from one file.
- `PersistentDashboardLayout` is loaded via `lazyWithRetry`, which lives in its own chunk.
- After a chunk-retry reload or HMR refresh, the lazy chunk re-imports the hook file with a new `?t=` query, while the eager bundle still references the old one.

The same class of bug was already fixed for the theme system — `ThemeContext` lives in its own dedicated file separate from `ThemeProvider`. We apply the same pattern here.

## Changes

### 1. Create `src/contexts/ActiveModeContext.ts` (new)

Tiny stable module that owns ONLY:
- `ActiveMode` type
- `ActiveModeContextType` interface
- `ActiveModeContext = createContext<ActiveModeContextType | undefined>(undefined)`

No React component code, no side effects → not subject to HMR re-evaluation, so every importer (eager or lazy) shares the exact same context instance.

### 2. Update `src/hooks/useActiveMode.tsx`

- Remove the local `createContext` and the `ActiveModeContextType` interface declaration.
- Import `ActiveModeContext`, `ActiveModeContextType`, and `ActiveMode` from `@/contexts/ActiveModeContext`.
- Re-export `ActiveMode` so existing `import { ActiveMode } from '@/hooks/useActiveMode'` keeps working (used by `ModeSwitcher.tsx`).
- Keep `ActiveModeProvider`, `useActiveMode`, and `useActiveModeQuery` exports unchanged.

### 3. No changes required to consumers

All current imports (`ActiveModeProvider`, `useActiveMode`, `ActiveMode`) keep their existing paths via the re-exports.

## Why this fully fixes it

Once the Context object lives in a leaf module with no JSX, Vite/HMR has no reason to invalidate it across chunks. Eager bundle and lazy `PersistentDashboardLayout` chunk both resolve to the same `ActiveModeContext` singleton, so `useContext` returns the live value the Provider published.

## Files touched

- **Add**: `src/contexts/ActiveModeContext.ts`
- **Edit**: `src/hooks/useActiveMode.tsx`

No other files, no DB changes, no behavior changes.
